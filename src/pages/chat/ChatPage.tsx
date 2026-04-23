import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Search, MessageSquare, ArrowLeft, Trash2, MoreVertical, Reply, X, Quote } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile, Message } from '@/types'
import { notify } from '@/store/notificationStore'

export function ChatPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [activeUser, setActiveUser] = useState<Profile | null>(null)
    const [text, setText] = useState('')
    const [search, setSearch] = useState('')
    const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { data: staff = [], isLoading: staffLoading } = useQuery({
        queryKey: ['staff-list'],
        queryFn: async () => {
            const { data: profiles } = await supabase.from('profiles').select('*').eq('is_active', true).neq('id', profile!.id).order('full_name')
            
            // Get last message time for each staff member
            const { data: lastMessages } = await supabase
                .from('messages')
                .select('sender_id, receiver_id, created_at')
                .or(`sender_id.eq.${profile!.id},receiver_id.eq.${profile!.id}`)
                .order('created_at', { ascending: false })
            
            // Build a map of last message time per user
            const lastMsgMap = new Map<string, string>()
            lastMessages?.forEach(msg => {
                const otherId = msg.sender_id === profile!.id ? msg.receiver_id : msg.sender_id
                if (!lastMsgMap.has(otherId)) {
                    lastMsgMap.set(otherId, msg.created_at)
                }
            })
            
            // Sort profiles by most recent message (or alphabetically if no messages)
            const sorted = (profiles ?? []).sort((a, b) => {
                const aTime = lastMsgMap.get(a.id) || '1970-01-01'
                const bTime = lastMsgMap.get(b.id) || '1970-01-01'
                return new Date(bTime).getTime() - new Date(aTime).getTime()
            })
            
            return sorted as Profile[]
        },
        enabled: !!profile,
    })

    const { data: messages = [], isLoading: msgsLoading } = useQuery({
        queryKey: ['messages', profile?.id, activeUser?.id],
        queryFn: async () => {
            if (!profile || !activeUser) return []
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${activeUser.id}),and(sender_id.eq.${activeUser.id},receiver_id.eq.${profile.id})`)
                .order('created_at', { ascending: true })
            if (error) throw error
            return (data ?? []) as Message[]
        },
        enabled: !!profile && !!activeUser,
        refetchInterval: 5000,
        staleTime: 0,
    })

    // Realtime
    useEffect(() => {
        if (!profile) return
        const channel = supabase.channel(`inbox:${profile.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const msg = payload.new as Message
                if (msg.sender_id === profile.id || msg.receiver_id === profile.id) {
                    const otherId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id
                    qc.invalidateQueries({ queryKey: ['messages', profile.id, otherId] })
                    qc.invalidateQueries({ queryKey: ['messages', otherId, profile.id] })
                    // If the message is from someone we ARE NOT currently chatting with, show a toast
                    if (msg.sender_id !== profile.id && activeUser?.id !== msg.sender_id) {
                        notify({
                            type: 'system',
                            title: 'New Message',
                            message: msg.content?.slice(0, 60) + (msg.content?.length > 60 ? '...' : ''),
                            link: '/chat',
                        })
                    }
                    // If it's from the person we're chatting with, scroll to bottom
                    if (activeUser?.id === msg.sender_id) {
                        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                    }
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, () => {
                if (activeUser) {
                    qc.invalidateQueries({ queryKey: ['messages', profile.id, activeUser.id] })
                }
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [profile?.id, activeUser?.id])

    useEffect(() => {
        if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (activeUser) setTimeout(() => inputRef.current?.focus(), 100)
    }, [activeUser?.id])

    useEffect(() => {
        setReplyingTo(null)
    }, [activeUser?.id])

    const sendMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!profile || !activeUser) throw new Error('No active conversation')
            let messageContent = content.trim()
            if (replyingTo) {
                const quote = replyingTo.content.length > 80
                    ? `"${replyingTo.content.slice(0, 80)}..."`
                    : `"${replyingTo.content}"`
                messageContent = `↩ ${quote}\n\n${content.trim()}`
            }
            const { error } = await supabase.from('messages').insert({
                sender_id: profile.id, receiver_id: activeUser.id, content: messageContent,
            })
            if (error) throw error
        },
        onSuccess: () => {
            setText('')
            setReplyingTo(null)
            qc.invalidateQueries({ queryKey: ['messages', profile?.id, activeUser?.id] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (msgId: string) => {
            const { error } = await supabase.from('messages').delete().eq('id', msgId).eq('sender_id', profile!.id)
            if (error) throw error
        },
        onMutate: async (msgId: string) => {
            // Optimistic removal
            await qc.cancelQueries({ queryKey: ['messages', profile?.id, activeUser?.id] })
            const prev = qc.getQueryData(['messages', profile?.id, activeUser?.id])
            qc.setQueryData(['messages', profile?.id, activeUser?.id], (old: Message[] = []) => old.filter(m => m.id !== msgId))
            return { prev }
        },
        onError: (_err, _id, ctx: any) => {
            if (ctx?.prev) qc.setQueryData(['messages', profile?.id, activeUser?.id], ctx.prev)
        },
        onSuccess: () => {
            setHoveredMsg(null)
        },
    })

    const handleSend = useCallback(() => {
        if (!text.trim() || !activeUser || sendMutation.isPending) return
        sendMutation.mutate(text.trim())
    }, [text, activeUser, sendMutation])

    const filteredStaff = staff.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()))
    const accent = getRoleAccent(profile?.role ?? 'assistant')

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleTimeString('en-NG', {
            hour: '2-digit', minute: '2-digit',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })

    const formatDateLabel = (ts: string) => {
        const d = new Date(ts)
        const today = new Date()
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
        if (d.toDateString() === today.toDateString()) return 'Today'
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="flex h-[calc(100vh-64px-80px)] lg:h-[calc(100vh-64px)] -m-4 sm:-m-6 overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-card">

            {/* Contacts sidebar */}
            <div className={`${activeUser ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-slate-100 flex-shrink-0`}>
                <div className="px-4 py-4 border-b border-slate-100">
                    <h2 className="font-bold text-slate-900 mb-3">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input className="w-full pl-9 pr-3 h-9 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {staffLoading ? (
                        <div className="p-3 space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                    ) : filteredStaff.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-10">No staff found</p>
                    ) : (
                        filteredStaff.map(s => (
                            <button key={s.id} onClick={() => setActiveUser(s)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0 ${activeUser?.id === s.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
                                    style={{ background: `linear-gradient(135deg, ${getRoleAccent(s.role)}, ${getRoleAccent(s.role)}cc)` }}>
                                    {getInitials(s.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 truncate">{s.full_name}</p>
                                    <span className={`text-xs capitalize font-medium ${getRoleColor(s.role)}`}>{s.role}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat window */}
            <div className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
                {!activeUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm font-medium">Select a staff member to chat</p>
                        <p className="text-xs opacity-60">Messages are private between staff</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-white flex-shrink-0">
                            <button className="md:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors mr-1" onClick={() => setActiveUser(null)}>
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${getRoleAccent(activeUser.role)}, ${getRoleAccent(activeUser.role)}cc)` }}>
                                {getInitials(activeUser.full_name)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-900">{activeUser.full_name}</p>
                                <span className={`text-xs capitalize font-medium ${getRoleColor(activeUser.role)}`}>{activeUser.role}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin bg-slate-50">
                            {msgsLoading ? (
                                <div className="space-y-3 pt-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                            <Skeleton className="h-10 w-48 rounded-2xl" />
                                        </div>
                                    ))}
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 py-10">
                                    <MessageSquare className="w-8 h-8 opacity-20" />
                                    <p className="text-sm">No messages yet</p>
                                    <p className="text-xs opacity-60">Say hello to {activeUser.full_name.split(' ')[0]}!</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, i) => {
                                        const isOwn = msg.sender_id === profile?.id
                                        const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()
                                        const showTime = i === messages.length - 1 || messages[i + 1].sender_id !== msg.sender_id || new Date(messages[i + 1].created_at).getTime() - new Date(msg.created_at).getTime() > 60000
                                        const isHovered = hoveredMsg === msg.id

                                        return (
                                            <div key={msg.id}>
                                                {showDate && (
                                                    <div className="flex items-center gap-2 my-4">
                                                        <div className="flex-1 h-px bg-slate-200" />
                                                        <span className="text-xs text-slate-400 px-3 py-1 rounded-full bg-white border border-slate-200 font-medium">{formatDateLabel(msg.created_at)}</span>
                                                        <div className="flex-1 h-px bg-slate-200" />
                                                    </div>
                                                )}
                                                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-0.5 group`}
                                                    onMouseEnter={() => setHoveredMsg(msg.id)}
                                                    onMouseLeave={() => setHoveredMsg(null)}>
                                                    {/* Delete button — only for own messages, shown on hover */}
                                                    {isOwn && isHovered && (
                                                        <button
                                                            onClick={() => deleteMutation.mutate(msg.id)}
                                                            className="self-center mr-1 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm"
                                                            title="Delete message"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    {/* Reply button — for all messages, shown on hover */}
                                                    {!isOwn && isHovered && (
                                                        <button
                                                            onClick={() => { setReplyingTo(msg); inputRef.current?.focus() }}
                                                            className="self-center mr-1 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
                                                            title="Reply to message"
                                                        >
                                                            <Reply className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    <div className="max-w-[78%] sm:max-w-[65%]">
                                                        <div className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${isOwn ? 'text-white rounded-2xl rounded-br-md shadow-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-md shadow-sm'}`}
                                                            style={isOwn ? { backgroundColor: accent } : {}}>
                                                            {msg.content}
                                                        </div>
                                                        {showTime && (
                                                            <p className={`text-[10px] text-slate-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                                {formatTime(msg.created_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={bottomRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-slate-100 bg-white flex-shrink-0">
                            {replyingTo && (
                                <div className="mb-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
                                    <Quote className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-blue-600">Replying to message</p>
                                        <p className="text-xs text-blue-500/80 truncate">{replyingTo.content}</p>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            {sendMutation.isError && <p className="text-xs text-red-500 mb-2 px-1">Failed to send. Try again.</p>}
                            <div className="flex items-center gap-2">
                                <input ref={inputRef}
                                    className="flex-1 h-11 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                                    placeholder={`Message ${activeUser.full_name.split(' ')[0]}...`}
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                    maxLength={2000}
                                />
                                <button onClick={handleSend} disabled={!text.trim() || sendMutation.isPending}
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:opacity-90 active:scale-95 flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: accent }}>
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
