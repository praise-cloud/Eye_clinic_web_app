import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  appointment_time: string
  appointment_type: string
  status: string
  notes?: string
  patient?: {
    first_name: string
    last_name: string
    phone?: string
  }
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-500',
  no_show: 'bg-orange-500',
}

const statusBg: Record<string, string> = {
  scheduled: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  confirmed: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800',
  completed: 'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700',
  cancelled: 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300 border-red-200 dark:border-red-800',
  no_show: 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800',
}

export function CalendarPage() {
  const { profile } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments-calendar', year, month],
    queryFn: async () => {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      let q = supabase.from('appointments').select('*, patient:patients(first_name, last_name, phone)')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_time', { ascending: true })
      if (profile?.role === 'doctor') {
        q = q.eq('doctor_id', profile.id)
      }
      const { data } = await q
      return (data ?? []) as Appointment[]
    },
  })

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const calendarDays = useMemo(() => {
    const days = []
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d)
    }
    return days
  }, [daysInMonth, firstDay])

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter(apt => apt.appointment_date === dateStr)
  }

  const selectedAppointments = selectedDate
    ? appointments.filter(apt => apt.appointment_date === selectedDate)
    : []

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const today = new Date().toISOString().split('T')[0]

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Calendar</h1>
          <p className="text-sm text-muted-foreground">{monthName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="capitalize text-muted-foreground">{status}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayAppts = getAppointmentsForDay(day)
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center
                    transition-all text-sm relative
                    ${isToday ? 'ring-2 ring-primary' : ''}
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}
                    ${dayAppts.length > 0 ? 'font-semibold' : ''}
                  `}
                >
                  <span>{day}</span>
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayAppts.slice(0, 3).map((apt, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${statusColors[apt.status] || 'bg-gray-400'}`}
                        />
                      ))}
                      {dayAppts.length > 3 && (
                        <span className="text-[8px]">+</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day appointments */}
      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-foreground mb-3">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </h3>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
              </div>
            ) : selectedAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No appointments</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedAppointments.map(apt => (
                  <Link
                    key={apt.id}
                    to={`/patients/${apt.patient_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className={`w-2 h-full rounded-full ${statusColors[apt.status] || 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {apt.patient?.first_name} {apt.patient?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {apt.appointment_time} • {apt.appointment_type.replace('_', ' ')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusBg[apt.status] || 'bg-gray-50 border-gray-200'}`}>
                      {apt.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}