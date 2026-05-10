import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Shield, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { notify } from '@/store/notificationStore'

export function AuditPage() {
    const [tableFilter, setTableFilter] = useState('all')
    const [actionFilter, setActionFilter] = useState('all')

    const { data: logs = [], isLoading, error } = useQuery({
        queryKey: ['audit-logs', tableFilter, actionFilter],
        queryFn: async () => {
            let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
            if (tableFilter !== 'all') q = q.eq('table_name', tableFilter)
            if (actionFilter !== 'all') q = q.eq('action', actionFilter)
            const { data: logsData, error } = await q
            if (error) throw error
            
            // Manually fetch profiles for user_ids
            const userIds = [...new Set((logsData ?? []).map(l => l.user_id).filter(Boolean))]
            let profilesMap: Record<string, any> = {}
            if (userIds.length > 0) {
                const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id,full_name,role').in('id', userIds)
                if (profilesError) throw profilesError
                profilesMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
            }
            
            return (logsData ?? []).map(log => ({
                ...log,
                user: log.user_id ? profilesMap[log.user_id] : null
            }))
        },
    })

    if (error) {
        console.error('Audit logs fetch error:', error)
        notify({ type: 'system', title: 'Error', message: 'Failed to load audit logs. Check RLS policies.', link: '/manager/audit' })
    }

    const actionColor: Record<string, 'success' | 'warning' | 'destructive'> = {
        INSERT: 'success', UPDATE: 'warning', DELETE: 'destructive',
    }

    return (
        <div className="space-y-5">
            <div><h1 className="text-xl font-bold">Audit Logs</h1><p className="text-sm text-muted-foreground">All system activity — append only</p></div>

            {error ? (
                <Card><CardContent className="text-center py-16">
                    <AlertCircle className="w-10 h-10 mx-auto mb-3 text-destructive/60" />
                    <p className="text-destructive font-medium">Failed to load audit logs</p>
                    <p className="text-xs text-muted-foreground mt-1">Check RLS policies — only managers can view audit logs</p>
                </CardContent></Card>
            ) : (
                <>
                    <div className="flex gap-3 flex-wrap">
                        <Select value={tableFilter} onValueChange={setTableFilter}>
                            <SelectTrigger className="w-44"><SelectValue placeholder="All Tables" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tables</SelectItem>
                                <SelectItem value="patients">Patients</SelectItem>
                                <SelectItem value="payments">Payments</SelectItem>
                                <SelectItem value="drug_dispensing">Drug Dispensing</SelectItem>
                                <SelectItem value="case_notes">Case Notes</SelectItem>
                                <SelectItem value="glasses_orders">Glasses Orders</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={actionFilter} onValueChange={setActionFilter}>
                            <SelectTrigger className="w-36"><SelectValue placeholder="All Actions" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="INSERT">Insert</SelectItem>
                                <SelectItem value="UPDATE">Update</SelectItem>
                                <SelectItem value="DELETE">Delete</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? <Skeleton className="h-64" /> : logs.length === 0 ? (
                        <Card><CardContent className="text-center py-16">
                            <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-muted-foreground">No audit logs found</p>
                            <p className="text-xs text-muted-foreground mt-1">Activity will appear here as users interact with the system</p>
                        </CardContent></Card>
                    ) : (
                        <Card><CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>{['Time', 'User', 'Action', 'Table', 'Record ID'].map(h => (
                                            <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                                        ))}</tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {logs.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-muted/20">
                                                <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(log.created_at)}</td>
                                                <td className="px-4 py-2.5">
                                                    <p className="font-medium text-xs">{log.user?.full_name ?? 'System'}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">{log.user?.role}</p>
                                                </td>
                                                <td className="px-4 py-2.5"><Badge variant={actionColor[log.action] ?? 'default'} className="text-xs">{log.action}</Badge></td>
                                                <td className="px-4 py-2.5 text-xs font-mono">{log.table_name}</td>
                                                <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground truncate max-w-[120px]">{log.record_id?.slice(0, 8)}...</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent></Card>
                    )}
                </>
            )}
        </div>
    )
}
