import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'
import { Activity, User, Package, FileText, Pill, Calendar, DollarSign } from 'lucide-react'

const actionIcons: Record<string, React.ElementType> = {
  patient: User,
  appointment: Calendar,
  case_note: FileText,
  drug: Pill,
  glasses: Package,
  payment: DollarSign,
  profile: User,
}

const actionColors: Record<string, string> = {
  patient: 'text-blue-500 bg-blue-50',
  appointment: 'text-indigo-500 bg-indigo-50',
  case_note: 'text-purple-500 bg-purple-50',
  drug: 'text-emerald-500 bg-emerald-50',
  glasses: 'text-pink-500 bg-pink-50',
  payment: 'text-amber-500 bg-amber-50',
  profile: 'text-cyan-500 bg-cyan-50',
  create: 'text-green-500',
  update: 'text-blue-500',
  delete: 'text-red-500',
  login: 'text-emerald-500',
}

export function ActivityFeed({ compact = false }: { compact?: boolean }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, user:profiles(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(compact ? 5 : 15)
      return data ?? []
    },
  })

  const formatTime = (ts: string) => {
    const date = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
  }

  const formatAction = (action: string) => {
    const [type, verb] = action.split('_')
    return { type, verb }
  }

  if (logs.length === 0) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardContent className={compact ? 'p-2' : 'p-3'}>
          <div className={`flex items-center gap-2 ${compact ? 'mb-1' : 'mb-3'}`}>
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-foreground`}>Activity</h3>
          </div>
          <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={compact ? 'h-full' : ''}>
      <CardContent className={compact ? 'p-2' : 'p-3'}>
        <div className={`flex items-center gap-2 ${compact ? 'mb-1' : 'mb-3'}`}>
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-foreground`}>Activity</h3>
        </div>

        <div className={`space-y-2 ${compact ? '' : ''}`}>
          {logs.map((log: any, idx: number) => {
            const { type, verb } = formatAction(log.action)
            const Icon = actionIcons[type] || FileText
            const color = actionColors[type] || 'text-gray-500 bg-gray-50'

            return (
              <div key={log.id || idx} className={`flex items-start gap-2 ${compact ? 'gap-1' : ''}`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${compact ? '' : color}`}>
                  <Icon className={compact ? 'w-3 h-3 text-muted-foreground' : `w-3 h-3 ${color.replace('bg-', 'text-')}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${compact ? 'text-[10px]' : 'text-xs'} text-foreground leading-tight`}>
                    <span className="font-medium">{log.user?.full_name || 'Unknown'}</span>
                    <span className="text-muted-foreground"> {verb}</span>
                    <span className="lowercase"> {type === 'case_note' ? 'note' : type}</span>
                  </p>
                  {!compact && log.new_data && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {log.table_name}: {JSON.stringify(log.new_data).slice(0, 50)}...
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                  {formatTime(log.created_at)}
                </span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}