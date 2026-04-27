import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, DollarSign, Clock, ShoppingCart, FileText, Pill, Calendar, TrendingUp, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format, isToday } from 'date-fns'

interface DailyStats {
  totalPatients: number
  todayAppointments: number
  completedToday: number
  dailyRevenue: number
  revenueByCategory: Record<string, number>
}

export function ManagerDashboard() {
  const { profile } = useAuthStore()
  const [stats, setStats] = useState<DailyStats>({
    totalPatients: 0,
    todayAppointments: 0,
    completedToday: 0,
    dailyRevenue: 0,
    revenueByCategory: {},
  })

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    async function fetchStats() {
      const [
        patientsCount,
        appointmentsData,
        completedData,
        paymentsData,
      ] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact' }).gte('scheduled_at', `${today}T00:00:00`).lte('scheduled_at', `${today}T23:59:59`),
        supabase.from('appointments').select('id', { count: 'exact' }).eq('status', 'completed').gte('scheduled_at', `${today}T00:00:00`).lte('scheduled_at', `${today}T23:59:59`),
        supabase.from('payments').select('payment_type, amount').gte('paid_at', `${today}T00:00:00`).lte('paid_at', `${today}T23:59:59`),
      ])

      const revenueByCategory: Record<string, number> = {}
      let dailyRevenue = 0
      paymentsData.data?.forEach(p => {
        dailyRevenue += Number(p.amount)
        revenueByCategory[p.payment_type] = (revenueByCategory[p.payment_type] || 0) + Number(p.amount)
      })

      setStats({
        totalPatients: patientsCount.count || 0,
        todayAppointments: appointmentsData.count || 0,
        completedToday: completedData.count || 0,
        dailyRevenue,
        revenueByCategory,
      })
    }

    fetchStats()
  }, [today])

  const { data: activeStaff = [] } = useQuery({
    queryKey: ['staff-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active')
        .eq('is_active', true)
        .neq('role', 'admin')
      return data || []
    },
  })

  const { data: recentPayments = [] } = useQuery({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, patient:patients(first_name, last_name), received_by:profiles(full_name)')
        .order('paid_at', { ascending: false })
        .limit(5)
      return data || []
    },
  })

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name)')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`)
        .order('scheduled_at', { ascending: true })
        .limit(10)
      return data || []
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryLabel = (type: string) => {
    const labels: Record<string, string> = {
      consultation: 'Consultation',
      drug: 'Pharmacy',
      glasses_deposit: 'Glasses (Deposit)',
      glasses_balance: 'Glasses (Balance)',
      subscription: 'Subscription',
      other: 'Other',
    }
    return labels[type] || type
  }

  const getCategoryIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      consultation: <FileText className="w-4 h-4" />,
      drug: <Pill className="w-4 h-4" />,
      glasses_deposit: <Eye className="w-4 h-4" />,
      glasses_balance: <Eye className="w-4 h-4" />,
      subscription: <TrendingUp className="w-4 h-4" />,
      other: <DollarSign className="w-4 h-4" />,
    }
    return icons[type] || <DollarSign className="w-4 h-4" />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Welcome, {profile?.full_name}</h1>
        <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Appointments</p>
                <p className="text-2xl font-bold">{stats.todayAppointments}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.completedToday} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.dailyRevenue)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Staff At Work</p>
                <p className="text-2xl font-bold">{activeStaff.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today's Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(stats.revenueByCategory).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions today</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(stats.revenueByCategory).map(([type, amount]) => (
                <div key={type} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-muted-foreground">{getCategoryIcon(type)}</span>
                    <span className="text-xs text-muted-foreground">{getCategoryLabel(type)}</span>
                  </div>
                  <p className="font-semibold">{formatCurrency(amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Staff At Work */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Staff At Work</CardTitle>
            <Link to="/manager/messages">
              <Button variant="ghost" size="sm">Message</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No staff currently active</p>
            ) : (
              <div className="space-y-2">
                {activeStaff.map(staff => (
                  <div key={staff.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {staff.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{staff.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.role}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today's Appointments</CardTitle>
            <Link to="/appointments">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No appointments today</p>
            ) : (
              <div className="space-y-2">
                {todayAppointments.map(apt => (
                  <div key={apt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <div className={`w-2 h-2 rounded-full ${
                      apt.status === 'completed' ? 'bg-green-500' :
                      apt.status === 'in_progress' ? 'bg-blue-500' :
                      apt.status === 'cancelled' ? 'bg-red-500' :
                      'bg-amber-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.scheduled_at), 'h:mm a')} · {apt.appointment_type?.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge variant={
                      apt.status === 'completed' ? 'success' :
                      apt.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    } className="text-xs capitalize">
                      {apt.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Link to="/manager/transactions">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left py-2">Patient</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">Method</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map(payment => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 text-sm">
                        {payment.patient?.first_name} {payment.patient?.last_name}
                      </td>
                      <td className="py-2 text-sm capitalize">{getCategoryLabel(payment.payment_type)}</td>
                      <td className="py-2 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="py-2 text-sm capitalize">{payment.payment_method || 'N/A'}</td>
                      <td className="py-2 text-sm text-muted-foreground">
                        {format(new Date(payment.paid_at), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}