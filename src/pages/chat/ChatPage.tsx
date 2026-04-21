import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Search, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile, Message } from '@/types'

export function ChatPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [activeUser, setActiveUser] = useState<Profile | null>(null)
    const [text, setText] = useState('')
    const [search, setSearch] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    const { data: staff = [], isLoading: staffLoading } = useQuery({
        queryKey: ['staff-list'],
        queryFn: async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_active', true)
                .neq('id', profile!.id)
                .order('full_name')
            return (data ?? []) as Profile[]
        },
        enabled: !!profile,
    })

    const { data: messages = [], isLoading: msgsLoading } = useQuery({
        queryKey: ['messages', profile?.id, activeUser?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${profile!.id},receiver_id.eq.${activeUser!.id}),and(sender_id.eq.${activeUser!.id},receiver_id.eq.${profile!.id})`)
                .order('created_at', { ascending: true })
            return (data ?? []) as Message[]
        },
        enabled: !!profile && !!activeUser,
    })

    // Realtime subscription
    useEffect(() => {
        if (!profile || !activeUser) return
        const channel = supabase
            .channel(`chat:${[profile.id, activeUser.id].sort().join('-')}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'messages',
            }, () => {
                qc.invalidateQueries({ queryKey: ['messages', profile.id, activeUser.id] })
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [profile?.id, activeUser?.id])

    // Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMutation = useMutation({
        mutationFn: async (content: string) => {
            await supabase.from('messages').insert({
                sender_id: profile!.id,
                receiver_id: activeUser!.id,
                content,
            })
        },
        onSuccess: () => {
            setText('')
            qc.invalidateQueries({ queryKey: ['messages', profile?.id, activeUser?.id] })
        },
    })

    const handleSend = () => {
        if (!text.trim() || !activeUser) return
        sendMutation.mutate(text.trim())
    }

    const filteredStaff = staff.filter(s =>
        s.full_name.toLowerCase().includes(search.toLowerCase())
    )

    const accent = getRoleAccent(profile?.role ?? 'assistant')

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="flex h-[calc(100vh-56px-80px)] lg:h-[calc(100vh-56px)] -m-4 md:-m-5 overflow-hidden">

            {/* Contacts sidebar */}
            <div className={`${activeUser ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r bg-card flex-shrink-0`}>
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-base mb-3">Staff Chat</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Search staff..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {staffLoading ? (
                        <div className="p-3 space-y-2">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14" />)}
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">No staff found</p>
                    ) : (
                        filteredStaff.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setActiveUser(s)}
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left ${activeUser?.id === s.id ? 'bg-muted' : ''}`}
                            >
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                    style={{ backgroundColor: getRoleAccent(s.role) }}
                                >
                                    {getInitials(s.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{s.full_name}</p>
                                    <span className={`text-xs capitalize px-1.5 py-0.5 rounded-full font-medium ${getRoleColor(s.role)}`}>
                                        {s.role}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat window */}
            <div className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
                {!activeUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <MessageSquare className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Select a staff member to start chatting</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card flex-shrink-0">
                            <button
                                className="md:hidden p-1 rounded hover:bg-muted mr-1"
                                onClick={() => setActiveUser(null)}
                            >
                                ←
                            </button>
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: getRoleAccent(activeUser.role) }}
                            >
                                {getInitials(activeUser.full_name)}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{activeUser.full_name}</p>
                                <span className={`text-xs capitalize ${getRoleColor(activeUser.role)}`}>{activeUser.role}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-muted/10">
                            {msgsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-48" />)}
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                    <MessageSquare className="w-8 h-8 opacity-20" />
                                    <p className="text-sm">No messages yet. Say hello!</p>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg, i) => {
                                        const isOwn = msg.sender_id === profile?.id
                                        const showDate = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()
                                        return (
                                            <div key={msg.id}>
                                                {showDate && (
                                                    <div className="flex items-center gap-2 my-3">
                                                        <div className="flex-1 h-px bg-border" />
                                                        <span className="text-xs text-muted-foreground px-2">
                                                            {new Date(msg.created_at).toDateString() === new Date().toDateString() ? 'Today' : new Date(msg.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                        <div className="flex-1 h-px bg-border" />
                                                    </div>
                                                )}
                                                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] md:max-w-[60%] group`}>
                                                        <div
                                                            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${isOwn
                                                                ? 'text-white rounded-br-sm'
                                                                : 'bg-card border rounded-bl-sm text-foreground'
                                                                }`}
                                                            style={isOwn ? { backgroundColor: accent } : {}}
                                                        >
                                                            {msg.content}
                                                        </div>
                                                        <p className={`text-[10px] text-muted-foreground mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                            {formatTime(msg.created_at)}
                                                        </p>
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
                        <div className="p-3 border-t bg-card flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <input
                                    className="flex-1 h-10 px-4 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder={`Message ${activeUser.full_name.split(' ')[0]}...`}
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                    maxLength={2000}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!text.trim() || sendMutation.isPending}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0"
                                    style={{ backgroundColor: accent }}
                                >
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
