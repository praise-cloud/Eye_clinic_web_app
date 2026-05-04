import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Calendar, Pill, FileText, Search, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { patientsAPI, appointmentsAPI, prescriptionsAPI } from '../../services/services'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { formatTime, formatDate } from '../../lib/utils'
import type { Patient, Appointment, Prescription } from '../../types'

export function DoctorDashboard() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch dashboard statistics
  const { data: stats } = useQuery({
    queryKey: ['doctor-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const [appointmentsRes, prescriptionsRes, patientsRes] = await Promise.all([
        appointmentsAPI.getStats(today),
        prescriptionsAPI.getAll({ doctor_id: user?.id }),
        patientsAPI.getAll({ limit: 1000 })
      ])

      const todayAppointments = appointmentsRes.data || {}
      const myPrescriptions = prescriptionsRes.data || []
      const allPatients = patientsRes.data || []

      return {
        todayAppointments: todayAppointments.total || 0,
        completedToday: todayAppointments.completed || 0,
        pendingPrescriptions: myPrescriptions.filter((p: Prescription) => p.status === 'pending').length,
        totalPatients: allPatients.length,
        upcomingAppointments: todayAppointments.pending || 0
      }
    }
  })

  // Fetch today's appointments
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['doctor-appointments'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const response = await appointmentsAPI.getAll({
        date: today,
        doctor_id: user?.id
      })
      return response.data || []
    },
    select: (appointments: Appointment[]) => 
      appointments.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
  })

  // Fetch pending prescriptions
  const { data: pendingPrescriptions = [] } = useQuery({
    queryKey: ['pending-prescriptions'],
    queryFn: async () => {
      const response = await prescriptionsAPI.getAll({ 
        doctor_id: user?.id,
        status: 'pending'
      })
      return response.data || []
    }
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

  const getPriorityIcon = (appointment: Appointment) => {
    if (appointment.status === 'arrived') return <AlertCircle className="w-4 h-4 text-orange-500" />
    if (appointment.status === 'confirmed') return <Clock className="w-4 h-4 text-blue-500" />
    if (appointment.status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />
    return <Clock className="w-4 h-4 text-gray-400" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-500">Manage patient appointments and prescriptions</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/doctor/prescriptions/new">
              <Pill className="w-4 h-4 mr-2" />
              New Prescription
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/doctor/patients">
              <Users className="w-4 h-4 mr-2" />
              View Patients
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
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.todayAppointments || 0}</p>
                <p className="text-xs text-gray-500">{stats?.completedToday || 0} completed</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingPrescriptions || 0}</p>
                <p className="text-xs text-gray-500">Awaiting dispensing</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-purple-600" />
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
                <p className="text-xs text-gray-500">In clinic database</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.upcomingAppointments || 0}</p>
                <p className="text-xs text-gray-500">Waiting for you</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
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
                    <div className="flex items-center gap-3 flex-1">
                      {getPriorityIcon(apt)}
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
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/doctor/appointments/${apt.id}`}>View</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/doctor/prescriptions/new?patient=${apt.patient_id}`}>
                          <Pill className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingPrescriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No pending prescriptions</div>
              ) : (
                pendingPrescriptions.map((prescription: Prescription) => (
                  <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {prescription.patients?.first_name} {prescription.patients?.last_name}
                        </h4>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                      <p className="text-sm text-gray-500">{prescription.patients?.patient_number}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>Created: {formatDate(prescription.created_at)}</span>
                        {prescription.lens_type && <span>Lens: {prescription.lens_type}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/doctor/prescriptions/${prescription.id}`}>
                          <Eye className="w-3 h-3" />
                        </Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link to={`/doctor/prescriptions/${prescription.id}/edit`}>Edit</Link>
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
              <Link to="/doctor/prescriptions/new">
                <Pill className="w-6 h-6 mb-2" />
                New Prescription
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/doctor/patients">
                <Users className="w-6 h-6 mb-2" />
                View Patients
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/doctor/appointments">
                <Calendar className="w-6 h-6 mb-2" />
                All Appointments
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link to="/doctor/prescriptions">
                <FileText className="w-6 h-6 mb-2" />
                All Prescriptions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
