import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Search, Trash2, CheckCircle, Clock, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Prescription } from '@/types'
import { notify } from '@/store/notificationStore'
import { formatDate } from '@/lib/utils'

export function DoctorPrescriptionsPage() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['doctor-prescriptions', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('prescriptions')
        .select('*, patient:patients(first_name, last_name, patient_number)')
        .eq('doctor_id', profile!.id)
        .order('created_at', { ascending: false })
      return (data ?? []) as Prescription[]
    },
    enabled: !!profile,
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prescriptions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor-prescriptions'] })
      notify({ type: 'prescription', title: 'Prescription Deleted', message: 'The prescription has been removed.' })
    },
  })

  const filtered = prescriptions.filter(rx => {
    if (!search) return true
    const patientName = `${(rx.patient as any)?.first_name} ${(rx.patient as any)?.last_name}`.toLowerCase()
    return patientName.includes(search.toLowerCase()) || rx.lens_type?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Prescriptions</h1>
          <p className="text-sm text-muted-foreground">{prescriptions.length} prescriptions written</p>
        </div>
        <Button size="sm" onClick={() => navigate('/doctor/case-notes')} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Prescription</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-10 pr-4 h-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          placeholder="Search patient or lens type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No prescriptions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create prescriptions from case notes</p>
          <Button className="mt-5 gap-1.5" onClick={() => navigate('/doctor/case-notes')}>
            <Plus className="w-4 h-4" />Write Prescription
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(rx => (
            <div key={rx.id} className="bg-card rounded-2xl border border-border shadow-card hover:shadow-card-md transition-all">
              <div className="flex items-center gap-3 p-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {(rx.patient as any)?.first_name?.[0]}{(rx.patient as any)?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/patients/${rx.patient_id}`} className="font-semibold text-foreground hover:text-primary transition-colors text-sm">
                      {(rx.patient as any)?.first_name} {(rx.patient as any)?.last_name}
                    </Link>
                    <span className="text-xs text-muted-foreground font-mono">{(rx.patient as any)?.patient_number}</span>
                    <Badge variant={rx.status === 'dispensed' ? 'success' : 'warning'} className="text-xs">
                      {rx.status === 'dispensed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                      {rx.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {rx.lens_type && <span className="capitalize">{rx.lens_type.replace('_', ' ')}</span>}
                    {rx.re_sphere !== undefined && <span>OD: {rx.re_sphere}{rx.re_cylinder !== undefined ? ` ${rx.re_cylinder}` : ''}</span>}
                    {rx.le_sphere !== undefined && <span>OS: {rx.le_sphere}{rx.le_cylinder !== undefined ? ` ${rx.le_cylinder}` : ''}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/patients/${rx.patient_id}`)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                    onClick={() => deleteMutation.mutate(rx.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
