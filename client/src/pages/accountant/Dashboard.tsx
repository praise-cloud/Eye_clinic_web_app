import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import type { Revenue, Appointment } from '../../types'

export function AccountantDashboard() {
  const [todayRevenue, setTodayRevenue] = useState<Revenue[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<Revenue[]>([])
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [todayRes, monthlyRes, appointmentsRes] = await Promise.all([
        fetch('/api/revenue/today'),
        fetch('/api/revenue/monthly'),
        fetch('/api/appointments/today')
      ])
      
      const [todayData, monthlyData, appointmentsData] = await Promise.all([
        todayRes.json(),
        monthlyRes.json(),
        appointmentsRes.json()
      ])
      
      if (todayData.success) setTodayRevenue(todayData.data)
      if (monthlyData.success) setMonthlyRevenue(monthlyData.data)
      if (appointmentsData.success) setTodayAppointments(appointmentsData.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalToday = todayRevenue.reduce((sum, r) => sum + r.amount, 0)
  const totalMonthly = monthlyRevenue.reduce((sum, r) => sum + r.amount, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Accountant Dashboard</h1>
          <p className="text-surface-500">Track revenue and payments</p>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Today's Revenue</p>
              <p className="text-xl font-bold text-surface-900">
                ${totalToday.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Monthly Revenue</p>
              <p className="text-xl font-bold text-surface-900">
                ${totalMonthly.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Today's Appointments</p>
              <p className="text-xl font-bold text-surface-900">{todayAppointments.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayRevenue.length === 0 ? (
                <p className="text-center text-surface-500 py-4">No transactions today</p>
              ) : (
                todayRevenue.map((revenue) => (
                  <div
                    key={revenue.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-surface-200"
                  >
                    <div>
                      <p className="font-medium text-surface-900">{revenue.source}</p>
                      <p className="text-sm text-surface-500">{revenue.description}</p>
                    </div>
                    <p className="font-medium text-green-600">
                      ${revenue.amount.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['pharmacy', 'consultation', 'tests', 'glasses'].map((source) => {
                const sourceRevenue = monthlyRevenue.filter(r => r.source === source)
                const sourceTotal = sourceRevenue.reduce((sum, r) => sum + r.amount, 0)
                return (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-600" />
                      <span className="capitalize text-surface-700">{source}</span>
                    </div>
                    <span className="font-medium">${sourceTotal.toLocaleString()}</span>
                  </div>
                )
              })}
              <hr className="border-surface-200" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-green-600">
                  ${totalMonthly.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}