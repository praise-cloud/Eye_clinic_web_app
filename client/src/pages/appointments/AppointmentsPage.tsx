import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Calendar, Clock, User, Filter } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import type { Appointment } from '../../types'

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadAppointments()
  }, [searchTerm, filter])

  const loadAppointments = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filter !== 'all') params.append('status', filter)
      
      const response = await fetch(`/api/appointments?${params}`)
      const data = await response.json()
      if (data.success) setAppointments(data.data)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'info'
      case 'completed': return 'success'
      case 'cancelled': return 'danger'
      case 'no_show': return 'warning'
      default: return 'default'
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
          <h1 className="text-2xl font-bold text-surface-900">Appointments</h1>
          <p className="text-surface-500">Manage patient appointments</p>
        </div>
        <div className="flex gap-2">
          <Link to="/appointments/new">
            <Button>
              <Plus className="w-4 h-4" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-surface-300 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      {/* Appointments List */}
      <Card>
        {appointments.length === 0 ? (
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-surface-900">No appointments found</h3>
            <p className="text-surface-500">Create your first appointment</p>
            <Link to="/appointments/new" className="btn btn-primary mt-4">
              <Plus className="w-4 h-4" />
              New Appointment
            </Link>
          </CardContent>
        ) : (
          <div className="divide-y divide-surface-200">
            {appointments.map((appointment) => (
              <Link
                key={appointment.id}
                to={`/appointments/${appointment.id}`}
                className="flex items-center justify-between p-4 hover:bg-surface-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-surface-900">
                      {appointment.patient?.first_name} {appointment.patient?.last_name}
                    </p>
                    <p className="text-sm text-surface-500">
                      {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                      {appointment.appointment_time}
                    </p>
                    <p className="text-sm text-surface-500">
                      {appointment.appointment_type} - {appointment.doctor?.first_name} {appointment.doctor?.last_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(appointment.status) as any}>
                    {appointment.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}