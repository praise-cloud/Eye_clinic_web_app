import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  patient?: { first_name: string; last_name: string }[] | { first_name: string; last_name: string }
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500',
  confirmed: 'bg-green-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-500',
  no_show: 'bg-orange-500',
}

export function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { data: appointments = [] } = useQuery({
    queryKey: ['admin-calendar', year, month],
    queryFn: async () => {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      const { data } = await supabase
        .from('appointments')
        .select('id, appointment_date, appointment_time, status, patient:patients(first_name, last_name)')
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
      return (data ?? []) as Appointment[]
    },
  })

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const calendarDays = useMemo(() => {
    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    return days
  }, [daysInMonth, firstDay])

  const getAppointmentsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return appointments.filter(apt => apt.appointment_date === dateStr)
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const today = new Date().toISOString().split('T')[0]
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{monthName}</h3>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-accent transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-accent transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayAppts = getAppointmentsForDay(day)
            const isToday = dateStr === today

            return (
              <div
                key={day}
                className={`
                  aspect-square rounded flex flex-col items-center justify-center
                  text-[10px] transition-all relative
                  ${isToday ? 'ring-1 ring-primary font-semibold' : ''}
                  ${dayAppts.length > 0 ? 'bg-accent' : ''}
                `}
              >
                <span>{day}</span>
                {dayAppts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayAppts.slice(0, 2).map((apt, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${statusColors[apt.status] || 'bg-gray-400'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border text-[9px]">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
              <span className="capitalize text-muted-foreground">{status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}