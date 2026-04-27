import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Send, Search, ArrowLeft, Circle } from 'lucide-react'
import { format, isToday, isYesterday } from 'date-fns'

interface Staff {
  id: string
  full_name: string
  role: string
  is_active: boolean
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
  sender?: Staff
  receiver?: Staff
}

export function MessagesPage() {
  const { profile } = useAuthStore()
  const qc = useQueryClient()
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: allStaff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff-all'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active')
        .eq('is_active', true)
        .neq('id', profile?.id)
        .order('full_name')
      return (data || []) as Staff[]
    },
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []
      
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      const conversationMap: Record<string, Message> = {}
      data?.forEach(msg => {
        const otherId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id
        if (!conversationMap[otherId]) {
          conversationMap[otherId] = msg
        }
      })

      return Object.values(conversationMap)
    },
  })

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', profile?.id, selectedStaff?.id],
    queryFn: async () => {
      if (!profile?.id || !selectedStaff?.id) return []
      
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedStaff.id}),and(sender_id.eq.${selectedStaff.id},receiver_id.eq.${profile.id})`)
        .order('created_at', { ascending: true })

      if (data) {
        await Promise.all(
          data.filter(m => m.receiver_id === profile.id && !m.is_read).map(m =>
            supabase.from('messages').update({ is_read: true }).eq('id', m.id)
          )
        )
      }

      return data || []
    },
    enabled: !!selectedStaff,
  })

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!profile?.id || !selectedStaff?.id || !message.trim()) return
      
      const { error } = await supabase.from('messages').insert({
        sender_id: profile.id,
        receiver_id: selectedStaff.id,
        content: message.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      setMessage('')
      qc.invalidateQueries({ queryKey: ['messages'] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filteredStaff = allStaff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  )

  const getOtherUser = (msg: Message): Staff | undefined => {
    return msg.sender_id === profile?.id ? msg.receiver : msg.sender
  }

  const formatMessageTime = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
  }

  const getUnreadCount = (staffId: string) => {
    return messages.filter(m => 
      m.sender_id === staffId && 
      m.receiver_id === profile?.id && 
      !m.is_read
    ).length
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Staff List */}
      <Card className={`w-full md:w-80 flex-shrink-0 ${selectedStaff ? 'hidden md:flex' : 'flex'} flex-col`}>
        <CardContent className="p-4 flex flex-col h-full">
          <h2 className="text-lg font-semibold mb-3">Messages</h2>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {staffLoading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </>
            ) : filteredStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No staff found</p>
            ) : (
              filteredStaff.map(staff => {
                const unread = getUnreadCount(staff.id)
                const lastMessage = conversations.find(c => 
                  c.sender_id === staff.id || c.receiver_id === staff.id
                )
                
                return (
                  <button
                    key={staff.id}
                    onClick={() => setSelectedStaff(staff)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedStaff?.id === staff.id 
                        ? 'bg-primary/10' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                        {staff.full_name?.charAt(0)}
                      </div>
                      <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 fill-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{staff.full_name}</p>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{staff.role}</p>
                    </div>
                    {unread > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 justify-center text-xs">
                        {unread}
                      </Badge>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card className={`flex-1 flex flex-col ${!selectedStaff ? 'hidden md:flex' : 'flex'}`}>
        {selectedStaff ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedStaff(null)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                {selectedStaff.full_name?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{selectedStaff.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{selectedStaff.role}</p>
              </div>
            </div>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 rounded-lg" />
                  ))}
                </>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start the conversation</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isOwn = msg.sender_id === profile?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-4 border-t">
              <form
                onSubmit={e => {
                  e.preventDefault()
                  sendMessage.mutate()
                }}
                className="flex gap-2"
              >
                <Input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!message.trim() || sendMessage.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">Select a staff member to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}