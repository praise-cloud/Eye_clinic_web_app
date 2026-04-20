import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import type { Appointment } from '../../types'

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    loadAppointments()
  }, [currentDate])

  const loadAppointments = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      
      const response = await fetch(
        `/api/appointments?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`
      )
      const data = await response.json()
      if (data.success) setAppointments(data.data)
    } catch (error) {
      console.error('Failed to load appointments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    
    const days: (number | null)[] = []
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    
    return days
  }

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter(a => a.appointment_date === dateStr)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 border-blue-300 text-blue-700'
      case 'completed': return 'bg-green-100 border-green-300 text-green-700'
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-700'
      case 'no_show': return 'bg-yellow-100 border-yellow-300 text-yellow-700'
      default: return 'bg-surface-100 border-surface-300'
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
          <h1 className="text-2xl font-bold text-surface-900">Calendar</h1>
          <p className="text-surface-500">View and manage appointments</p>
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

      {/* Calendar Navigation */}
      <Card>
        <div className="flex items-center justify-between p-4 border-b border-surface-200">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-surface-200">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-surface-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {getDaysInMonth().map((day, index) => {
            const dayAppointments = day ? getAppointmentsForDay(day) : []
            const isToday = day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear()
            
            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border-b border-r border-surface-200 ${
                  !day ? 'bg-surface-50' : ''
                }`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center' : ''
                    }`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map(apt => (
                        <Link
                          key={apt.id}
                          to={`/appointments/${apt.id}`}
                          className={`block text-xs p-1 rounded border ${getStatusColor(apt.status)}`}
                        >
                          {apt.appointment_time.slice(0, 5)} {apt.patient?.first_name}
                        </Link>
                      ))}
                      {dayAppointments.length > 3 && (
                        <p className="text-xs text-surface-500">+{dayAppointments.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent>
          <h3 className="font-medium mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            {['scheduled', 'completed', 'cancelled', 'no_show'].map(status => (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${getStatusColor(status).split(' ')[0]}`} />
                <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}