import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Settings, DollarSign, Calendar, AlertTriangle, TrendingUp, Activity, Shield } from 'lucide-react'
import { usersAPI, appointmentsAPI, paymentsAPI, inventoryAPI } from '../../services/services'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { formatCurrency } from '../../lib/utils'
import type { Profile, Appointment, Payment } from '../../types'

export function AdminDashboard() {
  const { user } = useAuthStore()

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, appointmentsRes, paymentsRes, lowStockRes] = await Promise.all([
        usersAPI.getAll(),
        appointmentsAPI.getStats(new Date().toISOString().split('T')[0]),
        paymentsAPI.getStats(new Date().toISOString().split('T')[0]),
        inventoryAPI.getLowStock()
      ])

      const activeUsers = usersRes.data?.filter((u: Profile) => u.is_active) || []
      const inactiveUsers = usersRes.data?.filter((u: Profile) => !u.is_active) || []

      return {
        totalUsers: usersRes.data?.length || 0,
        activeUsers: activeUsers.length,
        inactiveUsers: inactiveUsers.length,
        todayAppointments: appointmentsRes.data?.total || 0,
        completedToday: appointmentsRes.data?.completed || 0,
        dailyRevenue: paymentsRes.data?.totalRevenue || 0,
        lowStockItems: lowStockRes.data?.total || 0,
        totalRevenue: paymentsRes.data?.totalRevenue || 0
      }
    }
  })

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      // In a real app, this would fetch from an activities endpoint
      // For now, we'll return mock data
      return [
        {
          id: '1',
          type: 'user_created',
          message: 'New staff member John Doe was added',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: 'Admin'
        },
        {
          id: '2',
          type: 'payment_received',
          message: 'Payment of $150 received from patient #PAT-00123',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          user: 'Frontdesk'
        },
        {
          id: '3',
          type: 'appointment_completed',
          message: 'Appointment completed for patient Sarah Johnson',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          user: 'Doctor'
        }
      ]
    }
  })

  // Fetch system health
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      // Mock system health data
      return {
        database: 'healthy',
        api: 'healthy',
        storage: 'healthy',
        backup: 'completed',
        lastBackup: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    }
  })

  const getHealthColor = (status: string) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getActivityIcon = (type: string) => {
    const icons = {
      user_created: Users,
      payment_received: DollarSign,
      appointment_completed: Calendar,
      system_update: Settings,
      low_stock: AlertTriangle
    }
    return icons[type as keyof typeof icons] || Activity
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">System overview and administration</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/admin/users">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Database</span>
              <Badge className={getHealthColor(systemHealth?.database || 'unknown')}>
                {systemHealth?.database || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">API</span>
              <Badge className={getHealthColor(systemHealth?.api || 'unknown')}>
                {systemHealth?.api || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Storage</span>
              <Badge className={getHealthColor(systemHealth?.storage || 'unknown')}>
                {systemHealth?.storage || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Backup</span>
              <Badge className={getHealthColor(systemHealth?.backup || 'unknown')}>
                {systemHealth?.backup || 'Unknown'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                <p className="text-xs text-gray-500">{stats?.activeUsers || 0} active</p>
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
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayAppointments || 0}</p>
                <p className="text-xs text-gray-500">{stats?.completedToday || 0} completed</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
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
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.lowStockItems || 0}</p>
                <p className="text-xs text-gray-500">Need restocking</p>
              </div>
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="h-20 flex-col">
                <Link to="/admin/users">
                  <Users className="w-6 h-6 mb-2" />
                  Manage Users
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to="/admin/reports">
                  <TrendingUp className="w-6 h-6 mb-2" />
                  View Reports
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to="/admin/backup">
                  <Shield className="w-6 h-6 mb-2" />
                  System Backup
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link to="/admin/settings">
                  <Settings className="w-6 h-6 mb-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

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
      </div>

      {/* User Overview */}
      <Card>
        <CardHeader>
          <CardTitle>User Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.activeUsers || 0}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats?.inactiveUsers || 0}</div>
              <div className="text-sm text-gray-600">Inactive Users</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.totalUsers ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Active Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
