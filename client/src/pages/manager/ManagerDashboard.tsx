import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, DollarSign, TrendingUp, Calendar, AlertTriangle, FileText, BarChart3, Settings } from 'lucide-react'
import { usersAPI, appointmentsAPI, paymentsAPI, patientsAPI } from '../../services/services'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Profile, Appointment, Payment } from '../../types'

export function ManagerDashboard() {
  const { user } = useAuthStore()

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['manager-stats'],
    queryFn: async () => {
      const [usersRes, appointmentsRes, paymentsRes, patientsRes] = await Promise.all([
        usersAPI.getAll(),
        appointmentsAPI.getStats(new Date().toISOString().split('T')[0]),
        paymentsAPI.getStats(new Date().toISOString().split('T')[0]),
        patientsAPI.getStats()
      ])

      const activeUsers = usersRes.data?.filter((u: Profile) => u.is_active) || []
      const staffByRole = usersRes.data?.reduce((acc: any, u: Profile) => {
        acc[u.role] = (acc[u.role] || 0) + 1
        return acc
      }, {})

      return {
        totalStaff: usersRes.data?.length || 0,
        activeStaff: activeUsers.length,
        todayAppointments: appointmentsRes.data?.total || 0,
        completedToday: appointmentsRes.data?.completed || 0,
        dailyRevenue: paymentsRes.data?.totalRevenue || 0,
        totalPatients: patientsRes.data?.totalPatients || 0,
        newPatientsThisMonth: patientsRes.data?.newPatientsThisMonth || 0,
        staffByRole,
        revenueByCategory: paymentsRes.data?.revenueByCategory || {}
      }
    }
  })

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ['manager-activities'],
    queryFn: async () => {
      // Mock recent activities for manager
      return [
        {
          id: '1',
          type: 'user_created',
          message: 'New staff member added to the team',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: 'Manager'
        },
        {
          id: '2',
          type: 'revenue_milestone',
          message: 'Daily revenue target achieved: $2,500',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          user: 'System'
        },
        {
          id: '3',
          type: 'patient_registered',
          message: '15 new patients registered this week',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          user: 'Frontdesk'
        }
      ]
    }
  })

  // Fetch monthly trends (mock data for now)
  const { data: monthlyTrends } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: async () => {
      // Mock monthly trend data
      return {
        appointments: [45, 52, 48, 58, 62, 55, 68, 72, 65, 70, 75, 78],
        revenue: [1200, 1500, 1350, 1800, 1650, 1900, 2100, 2250, 2000, 2400, 2600, 2800],
        patients: [12, 15, 18, 14, 20, 16, 22, 25, 19, 23, 28, 30]
      }
    }
  })

  const getActivityIcon = (type: string) => {
    const icons = {
      user_created: Users,
      revenue_milestone: DollarSign,
      patient_registered: Users,
      system_update: Settings
    }
    return icons[type as keyof typeof icons] || FileText
  }

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      manager: 'bg-blue-100 text-blue-800 border-blue-200',
      doctor: 'bg-green-100 text-green-800 border-green-200',
      frontdesk: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500">Operations overview and staff management</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/manager/users">
              <Users className="w-4 h-4 mr-2" />
              Manage Staff
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/manager/reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalStaff || 0}</p>
                <p className="text-xs text-gray-500">{stats?.activeStaff || 0} active</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.dailyRevenue || 0)}</p>
                <p className="text-xs text-gray-500">Today's earnings</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
                <p className="text-xs text-gray-500">{stats?.newPatientsThisMonth || 0} new this month</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayAppointments || 0}</p>
                <p className="text-xs text-gray-500">{stats?.completedToday || 0} completed</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.staffByRole || {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleColor(role)}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium">{count} staff</span>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/manager/users?role=${role}`}>View</Link>
                  </Button>
                </div>
              ))}
              {Object.keys(stats?.staffByRole || {}).length === 0 && (
                <div className="text-center py-8 text-gray-500">No staff data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.revenueByCategory || {}).map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium capitalize">{category.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(Number(amount))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(Number(amount))}</p>
                    <p className="text-xs text-gray-500">
                      {stats?.dailyRevenue ? Math.round((Number(amount) / stats.dailyRevenue) * 100) : 0}%
                    </p>
                  </div>
                </div>
              ))}
              {Object.keys(stats?.revenueByCategory || {}).length === 0 && (
                <div className="text-center py-8 text-gray-500">No revenue data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No recent activities</div>
              ) : (
                recentActivities.map((activity: any) => {
                  const Icon = getActivityIcon(activity.type)
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.todayAppointments ? Math.round((stats.completedToday / stats.todayAppointments) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.totalStaff ? Math.round((stats.activeStaff / stats.totalStaff) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Staff Active Rate</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Patient Growth</span>
                  <span className="font-medium">+{stats?.newPatientsThisMonth || 0} this month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Staff Utilization</span>
                  <span className="font-medium">Good</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Revenue Trend</span>
                  <span className="font-medium text-green-600">↑ Increasing</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-20 flex-col">
              <Link to="/manager/users">
                <Users className="w-6 h-6 mb-2" />
                Manage Staff
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/manager/reports">
                <BarChart3 className="w-6 h-6 mb-2" />
                View Reports
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/manager/schedule">
                <Calendar className="w-6 h-6 mb-2" />
                Staff Schedule
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/manager/settings">
                <Settings className="w-6 h-6 mb-2" />
                Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
