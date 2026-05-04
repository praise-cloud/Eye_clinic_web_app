import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, User, Calendar, FileText, CreditCard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { formatDate } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'
import type { Patient } from '../../types'

export function PatientsPage() {
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')
  
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: async () => {
      let query = supabase.from('patients').select('*').order('created_at', { ascending: false })
      
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_number.ilike.%${search}%`)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data as Patient[]
    }
  })

  const getBackLink = () => {
    switch (profile?.role) {
      case 'frontdesk': return '/frontdesk'
      case 'doctor': return '/doctor'
      case 'admin': return '/admin'
      case 'manager': return '/manager'
      default: return '/'
    }
  }

  const canCreatePatient = ['frontdesk', 'admin'].includes(profile?.role ?? '')
  const canEditPatient = ['frontdesk', 'admin'].includes(profile?.role ?? '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Patients</h1>
            <p className="page-description">Manage patient records and information</p>
          </div>
          {canCreatePatient && (
            <Button asChild>
              <Link to="/patients/new">
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search patients by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle>All Patients</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No patients found</h3>
              <p className="text-muted-foreground">
                {search ? 'Try adjusting your search terms' : 'Get started by adding your first patient'}
              </p>
              {canCreatePatient && !search && (
                <Button asChild className="mt-4">
                  <Link to="/patients/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Patient
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {patients.map(patient => (
                <div key={patient.id} className="flex items-center justify-between p-4 border border-border rounded-lg card-hover">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {patient.first_name[0]}{patient.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{patient.patient_number}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {patient.phone}
                        </span>
                                              </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/patients/${patient.id}`}>
                        View Details
                      </Link>
                    </Button>
                    {canEditPatient && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/patients/${patient.id}/edit`}>
                          Edit
                        </Link>
                      </Button>
                    )}
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
