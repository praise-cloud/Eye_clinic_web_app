import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, Clock, User, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { formatDateTime } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import type { Appointment } from '../../types'

export function AppointmentsPage() {
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('upcoming')

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', search, statusFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name, patient_number), doctor:profiles(full_name)')
        .order('scheduled_at', { ascending: true })

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (dateFilter === 'upcoming') {
        query = query.gte('scheduled_at', new Date().toISOString())
      } else if (dateFilter === 'past') {
        query = query.lt('scheduled_at', new Date().toISOString())
      }

      if (search) {
        query = query.or(`patient.first_name.ilike.%${search}%,patient.last_name.ilike.%${search}%,patient.patient_number.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Appointment[]
    }
  })

  const statusColor: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'info'> = {
    pending: 'warning',
    confirmed: 'info',
    arrived: 'success',
    completed: 'success',
    cancelled: 'destructive',
    no_show: 'destructive',
    in_progress: 'default'
  }

  const getBackLink = () => {
    switch (profile?.role) {
      case 'frontdesk': return '/frontdesk'
      case 'doctor': return '/doctor'
      case 'admin': return '/admin'
      case 'manager': return '/manager'
      default: return '/'
    }
  }

  const canCreateAppointment = ['frontdesk', 'doctor'].includes(profile?.role ?? '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Manage patient appointments and schedules</p>
        </div>
        {canCreateAppointment && (
          <Button asChild>
            <Link to="/appointments/new">
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search patients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
                <SelectItem value="all">All Dates</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center justify-center">
              <Filter className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Filters Applied</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-600">
                {search || statusFilter !== 'all' || dateFilter !== 'upcoming' 
                  ? 'Try adjusting your filters' 
                  : 'Get started by scheduling your first appointment'
                }
              </p>
              {canCreateAppointment && !search && statusFilter === 'all' && dateFilter === 'upcoming' && (
                <Button asChild className="mt-4">
                  <Link to="/appointments/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule First Appointment
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map(appointment => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {appointment.appointment_type.replace('_', ' ')}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Patient: {(appointment.patient as any)?.first_name} {(appointment.patient as any)?.last_name}
                        {(appointment.patient as any)?.patient_number && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({(appointment.patient as any)?.patient_number})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDateTime(appointment.scheduled_at)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Dr. {(appointment.doctor as any)?.full_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={statusColor[appointment.status] || 'default'} className="text-xs">
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/appointments/${appointment.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
