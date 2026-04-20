import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, FileText, Pill, Clock, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { Appointment, CaseNote, Prescription } from '../../types'

export function DoctorDashboard() {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [pendingNotes, setPendingNotes] = useState<CaseNote[]>([])
  const [pendingPrescriptions, setPendingPrescriptions] = useState<Prescription[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [appointmentsRes, notesRes, prescriptionsRes] = await Promise.all([
        fetch('/api/appointments/today'),
        fetch('/api/case-notes/pending'),
        fetch('/api/prescriptions/pending')
      ])
      
      const [appointmentsData, notesData, prescriptionsData] = await Promise.all([
        appointmentsRes.json(),
        notesRes.json(),
        prescriptionsRes.json()
      ])
      
      if (appointmentsData.success) setTodayAppointments(appointmentsData.data)
      if (notesData.success) setPendingNotes(notesData.data)
      if (prescriptionsData.success) setPendingPrescriptions(prescriptionsData.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold text-surface-900">Doctor Dashboard</h1>
          <p className="text-surface-500">Manage your patients and appointments</p>
        </div>
        <div className="flex gap-2">
          <Link to="/case-notes/new" className="btn btn-primary">
            <FileText className="w-4 h-4" />
            New Case Note
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Pending Case Notes</p>
              <p className="text-xl font-bold text-surface-900">{pendingNotes.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Pending Prescriptions</p>
              <p className="text-xl font-bold text-surface-900">{pendingPrescriptions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Appointments</CardTitle>
            <Link to="/calendar" className="text-sm text-primary-600 hover:text-primary-700">
              View Calendar
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayAppointments.length === 0 ? (
                <p className="text-center text-surface-500 py-4">No appointments today</p>
              ) : (
                todayAppointments.slice(0, 5).map((appointment) => (
                  <Link
                    key={appointment.id}
                    to={`/patients/${appointment.patient_id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-primary-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium">
                        {appointment.patient?.first_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </p>
                        <p className="text-sm text-surface-500">
                          {appointment.appointment_time} - {appointment.appointment_type}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-surface-400" />
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
            <div className="space-y-3">
              <Link
                to="/patients"
                className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-primary-300"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">View Patients</span>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400" />
              </Link>
              <Link
                to="/case-notes"
                className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-primary-300"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">Case Notes</span>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400" />
              </Link>
              <Link
                to="/prescriptions"
                className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-primary-300"
              >
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">Prescriptions</span>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400" />
              </Link>
              <Link
                to="/calendar"
                className="flex items-center justify-between p-3 rounded-lg border border-surface-200 hover:border-primary-300"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <span className="font-medium">Calendar</span>
                </div>
                <ArrowRight className="w-4 h-4 text-surface-400" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}