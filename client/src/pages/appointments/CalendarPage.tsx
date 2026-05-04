import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { formatDate } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import type { Appointment } from '../../types'

export function CalendarPage() {
  const { profile } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['calendar-appointments', currentDate, viewMode],
    queryFn: async () => {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      let query = supabase
        .from('appointments')
        .select('*, patient:patients(first_name, last_name, patient_number), doctor:profiles(full_name)')
        .gte('scheduled_at', startOfMonth.toISOString())
        .lte('scheduled_at', endOfMonth.toISOString())
        .order('scheduled_at', { ascending: true })

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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getAppointmentsForDay = (day: number) => {
    const dayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 23, 59, 59)
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at)
      return aptDate >= dayStart && aptDate <= dayEnd
    })
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View and manage appointments schedule</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Day
            </Button>
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="bg-white p-2 h-24">
                    <Skeleton className="h-4 w-8 mb-1" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} className="bg-white p-2 h-24"></div>
                ))}

                {/* Days of the month */}
                {days.map(day => {
                  const dayAppointments = getAppointmentsForDay(day)
                  const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()

                  return (
                    <div
                      key={day}
                      className={`bg-white p-2 h-24 overflow-y-auto ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day}
                        </span>
                        {dayAppointments.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {dayAppointments.length}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((apt, idx) => (
                          <div
                            key={apt.id}
                            className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                            title={`${(apt.patient as any)?.first_name} ${(apt.patient as any)?.last_name} - ${apt.appointment_type}`}
                          >
                            <div className="flex items-center space-x-1">
                              <Clock className="w-2 h-2" />
                              <span>{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="truncate">
                              {(apt.patient as any)?.first_name} {(apt.patient as any)?.last_name}
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayAppointments.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {appointments
                .filter(apt => {
                  const aptDate = new Date(apt.scheduled_at)
                  const today = new Date()
                  return aptDate.toDateString() === today.toDateString()
                })
                .map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {appointment.appointment_type.replace('_', ' ')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {(appointment.patient as any)?.first_name} {(appointment.patient as any)?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(appointment.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' • Dr. '}{(appointment.doctor as any)?.full_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusColor[appointment.status] || 'default'} className="text-xs">
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              {appointments.filter(apt => {
                const aptDate = new Date(apt.scheduled_at)
                const today = new Date()
                return aptDate.toDateString() === today.toDateString()
              }).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No appointments scheduled for today</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
