import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getInitials, getRoleAccent, formatCurrency } from '@/lib/utils'
import { Activity, ArrowRight, RefreshCw, Clock, Calendar, User, Pill, Package, DollarSign, FileText, Plus } from 'lucide-react'

const actionLabels: Record<string, { label: string; icon: React.ElementType }> = {
  insert_profiles: { label: 'Created account', icon: Plus },
  login_profiles: { label: 'Logged in', icon: User },
  update_profiles: { label: 'Updated profile', icon: User },
  insert_patients: { label: 'Added patient', icon: User },
  update_patients: { label: 'Updated patient', icon: User },
  delete_patients: { label: 'Deleted patient', icon: User },
  insert_appointments: { label: 'Added appointment', icon: Calendar },
  update_appointments: { label: 'Updated appointment', icon: Calendar },
  insert_case_notes: { label: 'Added case note', icon: FileText },
  update_case_notes: { label: 'Updated case note', icon: FileText },
  insert_prescriptions: { label: 'Added prescription', icon: FileText },
  insert_drugs: { label: 'Added drug', icon: Pill },
  update_drugs: { label: 'Updated drug', icon: Pill },
  insert_drug_dispensing: { label: 'Dispensed drug', icon: Pill },
  insert_glasses_inventory: { label: 'Added glasses', icon: Package },
  update_glasses_inventory: { label: 'Updated glasses', icon: Package },
  insert_glasses_orders: { label: 'Created glasses order', icon: Package },
  insert_payments: { label: 'Recorded payment', icon: DollarSign },
}

function getLogDetails(log: any): string {
  const { new_data, table_name, action } = log
  if (!new_data) return ''
  
  try {
    if (table_name === 'patients') {
      return `${new_data.first_name || ''} ${new_data.last_name || ''}`.trim() || 'New patient'
    }
    if (table_name === 'payments') {
      return formatCurrency(Number(new_data.amount) || 0)
    }
    if (table_name === 'drugs') {
      return new_data.name || 'New drug'
    }
    if (table_name === 'glasses_orders') {
      return new_data.order_number || 'New order'
    }
    if (table_name === 'appointments') {
      return new_data.appointment_type || 'Appointment'
    }
    if (table_name === 'profiles') {
      return new_data.full_name || 'New user'
    }
    if (table_name === 'prescriptions') {
      return 'New prescription'
    }
    if (table_name === 'case_notes') {
      return new_data.diagnosis || 'Case note'
    }
    return ''
  } catch {
    return ''
  }
}

export function ActivityFeed({ compact = false }: { compact?: boolean }) {
  const { data: logs = [], refetch, isFetching } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*, user:profiles(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(compact ? 10 : 30)
      return data ?? []
    },
  })

  const groupedLogs = useMemo(() => {
    const now = new Date()
    const today = now.toDateString()
    const yesterday = new Date(now.getTime() - 86400000).toDateString()
    
    const groups: Record<string, typeof logs> = { today: [], yesterday: [], earlier: [] }
    
    logs.forEach((log: any) => {
      const logDate = new Date(log.created_at).toDateString()
      if (logDate === today) {
        groups.today.push(log)
      } else if (logDate === yesterday) {
        groups.yesterday.push(log)
      } else {
        groups.earlier.push(log)
      }
    })
    
    return groups
  }, [logs])

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

  const renderLog = (log: any, isCompact: boolean) => {
    const userName = log.user?.full_name || 'Unknown'
    const initials = getInitials(userName)
    const role = log.user?.role || 'frontdesk'
    const accent = getRoleAccent(role)
    const details = getLogDetails(log)
    const actionInfo = actionLabels[log.action] || { label: log.action?.replace(/_/g, ' ') || 'Action' }
    
    return (
      <div key={log.id} className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
            style={{ backgroundColor: accent + '15', color: accent }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">
              {userName.split(' ')[0]}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium" style={{ color: accent }}>
              {actionInfo.label}
            </span>
          </div>
          {details && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {details}
            </p>
          )}
        </div>
        <span className={`text-xs text-muted-foreground flex-shrink-0 ${isCompact ? '' : 'whitespace-nowrap'}`}>
          {formatTime(log.created_at)}
        </span>
      </div>
    )
  }

  const renderGroup = (label: string, groupLogs: typeof logs) => {
    if (groupLogs.length === 0) return null
    
    return (
      <div key={label}>
        {!compact && (
          <div className="flex items-center gap-2 mb-2 mt-4 first:mt-0">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
              {label}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
        <div className={`space-y-3 ${compact ? 'space-y-2' : ''}`}>
          {groupLogs.map((log: any) => renderLog(log, compact))}
        </div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardHeader className={compact ? 'pb-2' : 'pb-4'}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className={compact ? 'text-sm' : 'text-base'}>Recent Activity</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className={compact ? 'py-4' : ''}>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Actions will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={compact ? 'h-full' : ''}>
      <CardHeader className={compact ? 'pb-2' : 'pb-4'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className={compact ? 'text-sm' : 'text-base'}>Recent Activity</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            {!compact && (
              <Link 
                to="/admin/audit" 
                className="p-1.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-1 text-xs text-primary font-medium"
              >
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {compact ? (
          <div className="space-y-2">
            {logs.slice(0, 6).map((log: any) => renderLog(log, true))}
            {logs.length > 6 && (
              <Link to="/admin/audit" className="block text-center text-xs text-primary font-medium mt-3 pt-2 border-t border-border">
                View all {logs.length} activities →
              </Link>
            )}
          </div>
        ) : (
          <div>
            {renderGroup('Today', groupedLogs.today)}
            {renderGroup('Yesterday', groupedLogs.yesterday)}
            {renderGroup('Earlier', groupedLogs.earlier)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}