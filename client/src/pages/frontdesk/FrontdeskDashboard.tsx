import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Calendar, DollarSign, Plus, Search, Phone, Mail, MapPin } from 'lucide-react'
import { patientsAPI, appointmentsAPI, paymentsAPI } from '../../services/services'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { formatCurrency, formatDate, formatTime, isToday } from '../../lib/utils'
import type { Patient, Appointment, Payment } from '../../types'

export function FrontdeskDashboard() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['frontdesk-stats'],
    queryFn: async () => {
      const [patientsRes, appointmentsRes, paymentsRes] = await Promise.all([
        patientsAPI.getStats(),
        appointmentsAPI.getStats(new Date().toISOString().split('T')[0]),
        paymentsAPI.getStats(new Date().toISOString().split('T')[0])
      ])

      return {
        totalPatients: patientsRes.data?.totalPatients || 0,
        todayAppointments: appointmentsRes.data?.total || 0,
        completedToday: appointmentsRes.data?.completed || 0,
        dailyRevenue: paymentsRes.data?.totalRevenue || 0
      }
    }
  })

  // Fetch today's appointments
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: async () => {
      const response = await appointmentsAPI.getAll({
        date: new Date().toISOString().split('T')[0]
      })
      return response.data || []
    },
    select: (appointments: Appointment[]) => 
      appointments.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  })

  // Fetch recent patients
  const { data: recentPatients = [] } = useQuery({
    queryKey: ['recent-patients'],
    queryFn: async () => {
      const response = await patientsAPI.getAll({ limit: 5 })
      return response.data || []
    },
    select: (patients: Patient[]) => 
      patients.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  })

  // Filter appointments based on search
  const filteredAppointments = todayAppointments.filter((apt: Appointment) =>
    apt.patients?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.patients?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.patients?.patient_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      arrived: 'bg-green-100 text-green-800 border-green-200',
      in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      no_show: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frontdesk Dashboard</h1>
          <p className="text-gray-500">Manage patient registrations and appointments</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/frontdesk/patients/register">
              <Plus className="w-4 h-4 mr-2" />
              Register Patient
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/frontdesk/appointments/new">
              <Calendar className="w-4 h-4 mr-2" />
              Book Appointment
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalPatients || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedToday || 0}</p>
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
                <p className="text-sm font-medium text-gray-600">Daily Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.dailyRevenue || 0)}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Today's Appointments
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No appointments found' : 'No appointments scheduled for today'}
                </div>
              ) : (
                filteredAppointments.map((apt: Appointment) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {apt.patients?.first_name} {apt.patients?.last_name}
                        </h4>
                        <Badge className={getStatusColor(apt.status)}>
                          {getStatusText(apt.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{apt.patients?.patient_number}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>{formatTime(apt.scheduled_at)}</span>
                        <span>{apt.appointment_type?.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/frontdesk/appointments/${apt.id}`}>View</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/frontdesk/payments/new?patient=${apt.patient_id}`}>Payment</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentPatients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No patients registered yet</div>
              ) : (
                recentPatients.map((patient: Patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </h4>
                        <Badge variant="outline">{patient.gender}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{patient.patient_number}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        {patient.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {patient.phone}
                          </span>
                        )}
                        {patient.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {patient.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/frontdesk/patients/${patient.id}`}>View</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/frontdesk/appointments/new?patient=${patient.id}`}>Book</Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
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
              <Link to="/frontdesk/patients/register">
                <Plus className="w-6 h-6 mb-2" />
                Register New Patient
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/frontdesk/appointments/new">
                <Calendar className="w-6 h-6 mb-2" />
                Book Appointment
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/frontdesk/patients">
                <Users className="w-6 h-6 mb-2" />
                View All Patients
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/frontdesk/payments">
                <DollarSign className="w-6 h-6 mb-2" />
                Process Payment
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
