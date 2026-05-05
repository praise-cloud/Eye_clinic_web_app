import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Search, MessageSquare, ArrowLeft, Trash2, MoreVertical, Reply, X, Quote, Image, FileText, Pencil, Download, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile, Message } from '@/types'
import { notify } from '@/store/notificationStore'
import { Button } from '@/components/ui/button'

export function ChatPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const [activeUser, setActiveUser] = useState<Profile | null>(null)
    const [text, setText] = useState('')
    const [search, setSearch] = useState('')
    const [hoveredMsg, setHoveredMsg] = useState<string | null>(null)
    const [replyingTo, setReplyingTo] = useState<Message | null>(null)
    const [showOptions, setShowOptions] = useState<string | null>(null)
    const [editingMsg, setEditingMsg] = useState<Message | null>(null)
    const [editText, setEditText] = useState('')
    const [showAttachments, setShowAttachments] = useState(false)
    const [previewAttachment, setPreviewAttachment] = useState<{ type: string; url: string; name: string } | null>(null)
    const [pendingAttachment, setPendingAttachment] = useState<{ file: File; previewUrl?: string; type: 'image' | 'document'; name: string } | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const editInputRef = useRef<HTMLInputElement>(null)
    const optionsMenuRef = useRef<HTMLDivElement>(null)

    const { data: staff = [], isLoading: staffLoading } = useQuery({
        queryKey: ['staff-list'],
        queryFn: async () => {
            const { data: profiles } = await supabase.from('profiles').select('*').eq('is_active', true).neq('id', profile!.id).order('full_name')

            const { data: lastMessages } = await supabase
                .from('messages')
                .select('sender_id, receiver_id, created_at, is_read')
                .or(`sender_id.eq.${profile!.id},receiver_id.eq.${profile!.id}`)
                .order('created_at', { ascending: false })

            const lastMsgMap = new Map<string, string>()
            const unreadMap = new Map<string, number>()

            lastMessages?.forEach(msg => {
                const otherId = msg.sender_id === profile!.id ? msg.receiver_id : msg.sender_id
                if (!lastMsgMap.has(otherId)) {
                    lastMsgMap.set(otherId, msg.created_at)
                }
                if (msg.receiver_id === profile!.id && !msg.is_read) {
                    unreadMap.set(otherId, (unreadMap.get(otherId) || 0) + 1)
                }
            })

            const sorted = (profiles ?? []).sort((a, b) => {
                const aTime = lastMsgMap.get(a.id) || '1970-01-01'
                const bTime = lastMsgMap.get(b.id) || '1970-01-01'
                return new Date(bTime).getTime() - new Date(aTime).getTime()
            })

            return sorted.map(p => ({ ...p, unreadCount: unreadMap.get(p.id) || 0 })) as Profile[] & { unreadCount: number }[]
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

    useEffect(() => {
        if (!profile) return
        const channel = supabase.channel(`inbox:${profile.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                const msg = payload.new as Message
                if (msg.sender_id === profile.id || msg.receiver_id === profile.id) {
                    const otherId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id
                    qc.invalidateQueries({ queryKey: ['messages', profile.id, otherId] })
                    qc.invalidateQueries({ queryKey: ['messages', otherId, profile.id] })
                    // Notify the RECEIVER (not the sender) if they're not currently viewing this chat
                    if (msg.receiver_id === profile.id && activeUser?.id !== msg.sender_id) {
                        notify({
                            type: 'system',
                            title: 'New Message',
                            message: msg.content?.slice(0, 60) + (msg.content?.length > 60 ? '...' : '') || 'Sent an attachment',
                            link: '/chat',
                        }, msg.receiver_id)
                    }
                    if (activeUser?.id === msg.sender_id) {
                        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
                    }
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
                if (activeUser) {
                    qc.invalidateQueries({ queryKey: ['messages', profile.id, activeUser.id] })
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
        setShowOptions(null)
        setEditingMsg(null)
        setPendingAttachment(null)
    }, [activeUser?.id])

    // Close options menu on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
                setShowOptions(null)
            }
        }
        if (showOptions) {
            document.addEventListener('mousedown', handler)
            return () => document.removeEventListener('mousedown', handler)
        }
    }, [showOptions])

    useEffect(() => {
        if (editingMsg) {
            setTimeout(() => editInputRef.current?.focus(), 100)
        }
    }, [editingMsg])

    const uploadAttachment = async (file: File): Promise<{ url: string; type: 'image' | 'document'; name: string }> => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `chat/${profile!.id}/${fileName}`

        const { data, error } = await supabase.storage.from('files').upload(filePath, file)
        if (error) throw error

        const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(data.path)

        const type = file.type.startsWith('image/') ? 'image' : 'document'
        return { url: publicUrl, type, name: file.name }
    }

    const sendMutation = useMutation({
        mutationFn: async ({ content, attachment }: { content?: string; attachment?: { url: string; type: 'image' | 'document'; name: string } }) => {
            if (!profile || !activeUser) throw new Error('No active conversation')
            let messageContent = content?.trim() || ''
            if (replyingTo) {
                const quote = replyingTo.content.length > 80
                    ? `"${replyingTo.content.slice(0, 80)}..."`
                    : `"${replyingTo.content}"`
                messageContent = `↩ ${quote}\n\n${messageContent}`
            }
            const { error } = await supabase.from('messages').insert({
                sender_id: profile.id,
                receiver_id: activeUser.id,
                content: messageContent,
                attachment_url: attachment?.url || null,
                attachment_type: attachment?.type || null,
                attachment_name: attachment?.name || null,
            })
            if (error) throw error
        },
        onSuccess: () => {
            setText('')
            setReplyingTo(null)
            setShowAttachments(false)
            qc.invalidateQueries({ queryKey: ['messages', profile?.id, activeUser?.id] })
            qc.invalidateQueries({ queryKey: ['staff-list'] })
            // Notify recipient of new message
            if (profile && activeUser) {
                notify({
                    type: 'system',
                    title: `New message from ${profile.full_name || 'A staff member'}`,
                    message: text.trim() ? text.trim().slice(0, 50) + (text.trim().length > 50 ? '...' : '') : 'Sent you an attachment',
                    link: '/chat'
                }, activeUser.id)
            }
        },
    })

    const editMutation = useMutation({
        mutationFn: async ({ id, content }: { id: string; content: string }) => {
            const { error } = await supabase.from('messages').update({ content, updated_at: new Date().toISOString() }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            setEditingMsg(null)
            setEditText('')
            qc.invalidateQueries({ queryKey: ['messages', profile?.id, activeUser?.id] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (msgId: string) => {
            const { error } = await supabase.from('messages').delete().eq('id', msgId).eq('sender_id', profile!.id)
            if (error) throw error
        },
        onSuccess: () => {
            setHoveredMsg(null)
            setShowOptions(null)
        },
    })

    const markAsRead = useMutation({
        mutationFn: async (otherUserId: string) => {
            await supabase.from('messages').update({ is_read: true, read_at: new Date().toISOString() })
                .eq('receiver_id', profile!.id).eq('sender_id', otherUserId).eq('is_read', false)
            // Also mark related notifications as read
            await supabase.from('notifications').update({ is_read: true })
                .eq('user_id', profile!.id).eq('link', '/chat').eq('is_read', false)
        },
    })

    useEffect(() => {
        if (activeUser?.id) {
            markAsRead.mutate(activeUser.id)
        }
    }, [activeUser?.id])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !activeUser) return

        const type = file.type.startsWith('image/') ? 'image' : 'document'
        const previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined

        setPendingAttachment({ file, previewUrl, type, name: file.name })
        setShowAttachments(false)
        e.target.value = ''
    }

    const handleSend = async () => {
        if ((!text.trim() && !pendingAttachment) || !activeUser || sendMutation.isPending) return

        let attachment: { url: string; type: 'image' | 'document'; name: string } | undefined

        if (pendingAttachment) {
            try {
                attachment = await uploadAttachment(pendingAttachment.file)
                if (pendingAttachment.previewUrl) URL.revokeObjectURL(pendingAttachment.previewUrl)
                setPendingAttachment(null)
            } catch (err) {
                notify({ type: 'system', title: 'Upload Failed', message: 'Failed to upload attachment' })
                return
            }
        }

        sendMutation.mutate({ content: text.trim(), attachment })
    }

    const handleEditSave = () => {
        if (!editingMsg || !editText.trim()) return
        editMutation.mutate({ id: editingMsg.id, content: editText.trim() })
    }

    const filteredStaff = staff.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()))
    const accent = getRoleAccent(profile?.role ?? 'frontdesk')

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })

    const formatDateLabel = (ts: string) => {
        const d = new Date(ts)
        const today = new Date()
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
        if (d.toDateString() === today.toDateString()) return 'Today'
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="flex h-[calc(100vh-64px-80px)] lg:h-[calc(100vh-64px)] -m-4 sm:-m-6 overflow-hidden bg-card rounded-2xl border border-border shadow-card">
            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileSelect} />

            {/* Attachment preview modal */}
            {previewAttachment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewAttachment(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPreviewAttachment(null)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
                            <X className="w-6 h-6" />
                        </button>
                        {previewAttachment.type === 'image' ? (
                            <img src={previewAttachment.url} alt={previewAttachment.name} className="max-w-full max-h-[85vh] rounded-lg" />
                        ) : (
                            <div className="bg-card p-8 rounded-lg text-center">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                <p className="text-foreground font-medium mb-2">{previewAttachment.name}</p>
                                <a href={previewAttachment.url} download className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                                    <Download className="w-4 h-4" /> Download
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Contacts sidebar */}
            <div className={`${activeUser ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r border-border flex-shrink-0`}>
                <div className="px-4 py-4 border-b border-border">
                    <h2 className="font-bold text-foreground mb-3">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input className="w-full pl-9 pr-3 h-9 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {staffLoading ? (
                        <div className="p-3 space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                    ) : filteredStaff.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-10">No staff found</p>
                    ) : (
                        filteredStaff.map(s => {
                            const unread = (s as any).unreadCount || 0
                            return (
                            <button key={s.id} onClick={() => setActiveUser(s)}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors text-left border-b border-border last:border-0 ${activeUser?.id === s.id ? 'bg-accent border-l-2 border-l-primary' : ''}`}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0 shadow-sm"
                                    style={{ background: `linear-gradient(135deg, ${getRoleAccent(s.role)}, ${getRoleAccent(s.role)}cc)` }}>
                                    {getInitials(s.full_name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{s.full_name}</p>
                                    <span className={`text-xs capitalize font-medium ${getRoleColor(s.role)}`}>{s.role}</span>
                                </div>
                                {unread > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">{unread > 9 ? '9+' : unread}</span>
                                )}
                            </button>
                        )})
                    )}
                </div>
            </div>

            {/* Chat window */}
            <div className={`${activeUser ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
                {!activeUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-sm font-medium">Select a staff member to chat</p>
                        <p className="text-xs opacity-60">Messages are private between staff</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-card flex-shrink-0">
                            <button className="md:hidden p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors mr-1" onClick={() => setActiveUser(null)}>
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0 shadow-sm"
                                style={{ background: `linear-gradient(135deg, ${getRoleAccent(activeUser.role)}, ${getRoleAccent(activeUser.role)}cc)` }}>
                                {getInitials(activeUser.full_name)}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm text-foreground">{activeUser.full_name}</p>
                                <span className={`text-xs capitalize font-medium ${getRoleColor(activeUser.role)}`}>{activeUser.role}</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin bg-muted/30">
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

                                        return (
                                            <div key={msg.id}>
                                                {showDate && (
                                                    <div className="flex items-center gap-2 my-4">
                                                        <div className="flex-1 h-px bg-border" />
                                                        <span className="text-xs text-muted-foreground px-3 py-1 rounded-full bg-card border border-border font-medium">{formatDateLabel(msg.created_at)}</span>
                                                        <div className="flex-1 h-px bg-border" />
                                                    </div>
                                                )}
                                                <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-0.5 group relative items-start`}>
                                                    {/* Options button — own messages on left */}
                                                    {isOwn && (
                                                        <div className="relative flex items-center self-center mr-1" ref={showOptions === msg.id ? optionsMenuRef : undefined}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setShowOptions(showOptions === msg.id ? null : msg.id) }}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-accent"
                                                            >
                                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                            </button>
                                                            {showOptions === msg.id && (
                                                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-card border border-border rounded-xl shadow-lg p-1.5 flex flex-col gap-1 min-w-[120px] z-20">
                                                                    <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setShowOptions(null); inputRef.current?.focus() }} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent text-foreground text-left">
                                                                        <Reply className="w-3.5 h-3.5" /> Reply
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); setEditingMsg(msg); setEditText(msg.content || ''); setShowOptions(null) }} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent text-foreground text-left">
                                                                        <Pencil className="w-3.5 h-3.5" /> Edit
                                                                    </button>
                                                                    <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(msg.id); setShowOptions(null) }} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent text-red-500 text-left">
                                                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="max-w-[78%] sm:max-w-[65%]">
                                                        {/* Attachment preview */}
                                                        {msg.attachment_url && (
                                                            <div className="mb-2">
                                                                {msg.attachment_type === 'image' ? (
                                                                    <button onClick={() => setPreviewAttachment({ type: 'image', url: msg.attachment_url!, name: msg.attachment_name || 'image' })}>
                                                                        <img src={msg.attachment_url} alt={msg.attachment_name || 'image'} className="max-w-full rounded-lg border border-border hover:opacity-90 transition-opacity cursor-pointer" />
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => setPreviewAttachment({ type: 'document', url: msg.attachment_url!, name: msg.attachment_name || 'document' })} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                                                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                                                        <span className="text-sm text-foreground truncate">{msg.attachment_name || 'Document'}</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {editingMsg?.id === msg.id ? (
                                                            <div className="flex items-center gap-2">
                                                                <input ref={editInputRef} value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') setEditingMsg(null) }}
                                                                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                                                <button onClick={handleEditSave} className="px-3 py-2 text-sm bg-primary text-white rounded-xl hover:bg-primary/90">Save</button>
                                                                <button onClick={() => setEditingMsg(null)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className={`px-3.5 py-2.5 text-sm leading-relaxed break-words ${isOwn ? 'text-white rounded-2xl rounded-br-md shadow-sm' : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-md shadow-sm'}`}
                                                                    style={isOwn ? { backgroundColor: accent } : {}}>
                                                                    {msg.content}
                                                                </div>
                                                                {showTime && (
                                                                    <p className={`text-[10px] text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                                        {formatTime(msg.created_at)}{msg.updated_at && msg.updated_at !== msg.created_at && ' · edited'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Options button — received messages on right */}
                                                    {!isOwn && (
                                                        <div className="relative flex items-center self-center ml-1" ref={showOptions === msg.id ? optionsMenuRef : undefined}>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setShowOptions(showOptions === msg.id ? null : msg.id) }}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-accent"
                                                            >
                                                                <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                            </button>
                                                            {showOptions === msg.id && (
                                                                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-card border border-border rounded-xl shadow-lg p-1.5 flex flex-col gap-1 min-w-[120px] z-20">
                                                                    <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setShowOptions(null); inputRef.current?.focus() }} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent text-foreground text-left">
                                                                        <Reply className="w-3.5 h-3.5" /> Reply
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={bottomRef} />
                                </>
                            )}
                        </div>

                        {/* Input */}
                        <div className="p-3 border-t border-border bg-card flex-shrink-0">
                            {pendingAttachment && (
                                <div className="mb-2 px-3 py-2 rounded-xl bg-muted border border-border flex items-center gap-3">
                                    {pendingAttachment.type === 'image' && pendingAttachment.previewUrl ? (
                                        <img src={pendingAttachment.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                                    ) : (
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground truncate">{pendingAttachment.name}</p>
                                        <p className="text-xs text-muted-foreground">{pendingAttachment.type === 'image' ? 'Photo' : 'Document'} ready to send</p>
                                    </div>
                                    <button onClick={() => setPendingAttachment(null)} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-red-500 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            {replyingTo && (
                                <div className="mb-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                                    <Quote className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">Replying to message</p>
                                        <p className="text-xs text-blue-500/80 truncate">{replyingTo.content}</p>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                            {sendMutation.isError && <p className="text-xs text-red-500 mb-2 px-1">Failed to send. Try again.</p>}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button onClick={() => setShowAttachments(!showAttachments)} className="w-11 h-11 rounded-2xl flex items-center justify-center border border-input hover:bg-accent transition-colors">
                                        <Image className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                    {showAttachments && (
                                        <div className="absolute bottom-full mb-2 left-0 bg-card border border-border rounded-xl shadow-lg p-2 flex gap-2">
                                            <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl hover:bg-accent flex flex-col items-center gap-1">
                                                <Image className="w-5 h-5 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">Photo</span>
                                            </button>
                                            <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-xl hover:bg-accent flex flex-col items-center gap-1">
                                                <FileText className="w-5 h-5 text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">File</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <input ref={inputRef}
                                    className="flex-1 h-11 px-4 rounded-2xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-card transition-all"
                                    placeholder={`Message ${activeUser?.full_name?.split(' ')[0] ?? ''}...`}
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                    maxLength={2000}
                                />
                                <button onClick={handleSend} disabled={(!text.trim() && !pendingAttachment) || sendMutation.isPending}
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