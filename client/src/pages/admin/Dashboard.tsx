import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, DollarSign, FileText, Package, Pill, Calendar, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { DashboardStats, User } from '../../types'

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
      
      const patientsRes = await fetch('/api/patients?limit=5')
      const patientsData = await patientsRes.json()
      if (patientsData.success) {
        setRecentPatients(patientsData.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      change: '+12%'
    },
    {
      title: "Today's Revenue",
      value: `$${(stats?.todayRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      change: '+8%'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      change: '+15%'
    },
    {
      title: 'Pending Prescriptions',
      value: stats?.pendingPrescriptions || 0,
      icon: Pill,
      color: 'bg-yellow-100 text-yellow-600',
      change: ''
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockItems || 0,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
      change: ''
    },
    {
      title: "Today's Appointments",
      value: stats?.totalAppointmentsToday || 0,
      icon: Calendar,
      color: 'bg-indigo-100 text-indigo-600',
      change: ''
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="text-surface-500">Welcome back! Here's an overview of your clinic.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/patients/new" className="btn btn-primary">
            <Users className="w-4 h-4" />
            Add Patient
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-surface-500">{stat.title}</p>
                  <p className="text-xl font-bold text-surface-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Patients</CardTitle>
            <Link to="/patients" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPatients.length === 0 ? (
                <p className="text-center text-surface-500 py-4">No patients yet</p>
              ) : (
                recentPatients.map((patient) => (
                  <Link
                    key={patient.id}
                    to={`/patients/${patient.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-50"
                  >
                    <div>
                      <p className="font-medium text-surface-900">
                        {patient.first_name} {patient.last_name}
                      </p>
                      <p className="text-sm text-surface-500">{patient.patient_id}</p>
                    </div>
                    <Badge variant={patient.client_type === 'new' ? 'success' : 'default'}>
                      {patient.client_type || 'Regular'}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/patients/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <Users className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium">Add Patient</span>
              </Link>
              <Link
                to="/appointments/new"
                className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <Calendar className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium">Book Appointment</span>
              </Link>
              <Link
                to="/inventory"
                className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <Package className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium">Check Inventory</span>
              </Link>
              <Link
                to="/revenue"
                className="flex items-center gap-3 p-3 rounded-lg border border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <DollarSign className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium">View Revenue</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}