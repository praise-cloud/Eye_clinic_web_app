import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInitials, getRoleAccent, getRoleColor } from '@/lib/utils'
import { Activity, User, Package, FileText, Pill, Calendar, DollarSign, LogIn, Trash2, Plus } from 'lucide-react'

const actionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  insert_profiles: { icon: Plus, color: 'text-green-500', label: 'Created account' },
  login_profiles: { icon: LogIn, color: 'text-emerald-500', label: 'Logged in' },
  update_profiles: { icon: User, color: 'text-blue-500', label: 'Updated profile' },
  insert_patients: { icon: User, color: 'text-blue-500', label: 'Added patient' },
  update_patients: { icon: User, color: 'text-indigo-500', label: 'Updated patient' },
  delete_patients: { icon: Trash2, color: 'text-red-500', label: 'Deleted patient' },
  insert_appointments: { icon: Calendar, color: 'text-purple-500', label: 'Added appointment' },
  update_appointments: { icon: Calendar, color: 'text-indigo-500', label: 'Updated appointment' },
  insert_case_notes: { icon: FileText, color: 'text-pink-500', label: 'Added case note' },
  update_case_notes: { icon: FileText, color: 'text-rose-500', label: 'Updated case note' },
  insert_prescriptions: { icon: Pill, color: 'text-teal-500', label: 'Added prescription' },
  insert_drugs: { icon: Pill, color: 'text-amber-500', label: 'Added drug' },
  update_drugs: { icon: Pill, color: 'text-orange-500', label: 'Updated drug' },
  insert_drug_dispensing: { icon: Pill, color: 'text-cyan-500', label: 'Dispensed drug' },
  insert_glasses_inventory: { icon: Package, color: 'text-violet-500', label: 'Added glasses' },
  update_glasses_inventory: { icon: Package, color: 'text-fuchsia-500', label: 'Updated glasses' },
  insert_glasses_orders: { icon: Package, color: 'text-pink-500', label: 'Created glasses order' },
  insert_payments: { icon: DollarSign, color: 'text-green-500', label: 'Recorded payment' },
}

export function ActivityFeed({ compact = false }: { compact?: boolean }) {
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, user:profiles(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(compact ? 8 : 20)
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
    return date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  if (logs.length === 0) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardHeader className={compact ? 'pb-2' : 'pb-4'}>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className={compact ? 'text-sm' : 'text-base'}>Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent className={compact ? 'py-4' : ''}>
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={compact ? 'h-full' : ''}>
      <CardHeader className={compact ? 'pb-2' : 'pb-4'}>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <CardTitle className={compact ? 'text-sm' : 'text-base'}>Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`space-y-2 ${compact ? 'space-y-1' : ''}`}>
          {logs.map((log: any, idx: number) => {
            const config = actionConfig[log.action] || { icon: Activity, color: 'text-gray-500', label: log.action }
            const Icon = config.icon
            
            return (
              <div key={log.id || idx} className={`flex items-center gap-3 ${compact ? 'gap-2' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${compact ? 'w-7 h-7' : ''}`}
                     style={{ backgroundColor: `${config.color}20` }}>
                  <Icon className={`w-4 h-4 ${compact ? 'w-3 h-3' : ''}`} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium text-foreground truncate ${compact ? 'text-xs' : ''}`}>
                    {log.user?.full_name || 'Unknown'}
                  </p>
                  <p className={`text-xs text-muted-foreground truncate ${compact ? 'hidden' : ''}`}>
                    {config.label}
                    {log.table_name !== 'profiles' && log.table_name !== 'audit_logs' && ` • ${log.table_name?.replace('_', ' ')}`}
                  </p>
                </div>
                <span className={`text-xs text-muted-foreground flex-shrink-0 ${compact ? 'text-[10px]' : ''}`}>
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