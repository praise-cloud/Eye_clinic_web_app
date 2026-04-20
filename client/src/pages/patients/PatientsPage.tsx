import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter, Download, User, Phone, Mail, MapPin } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import type { Patient } from '../../types'

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadPatients()
  }, [searchTerm, filter])

  const loadPatients = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filter !== 'all') params.append('client_type', filter)
      
      const response = await fetch(`/api/patients?${params}`)
      const data = await response.json()
      if (data.success) setPatients(data.data)
    } catch (error) {
      console.error('Failed to load patients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportCSV = () => {
    const csv = [
      ['Patient ID', 'First Name', 'Last Name', 'Gender', 'Contact', 'Email', 'Client Type', 'Intake Date'].join(','),
      ...patients.map(p => [
        p.patient_id, p.first_name, p.last_name, p.gender, p.contact, p.email, p.client_type, p.intake_date
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
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
          <h1 className="text-2xl font-bold text-surface-900">Patients</h1>
          <p className="text-surface-500">Manage patient records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={exportCSV}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Link to="/patients/new">
            <Button>
              <Plus className="w-4 h-4" />
              Add Patient
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
            placeholder="Search patients..."
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
          <option value="all">All Types</option>
          <option value="new">New</option>
          <option value="returning">Returning</option>
          <option value="referral">Referral</option>
        </select>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <User className="w-12 h-12 text-surface-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-surface-900">No patients found</h3>
                <p className="text-surface-500">Get started by adding your first patient</p>
                <Link to="/patients/new" className="btn btn-primary mt-4">
                  <Plus className="w-4 h-4" />
                  Add Patient
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : (
          patients.map((patient) => (
            <Link key={patient.id} to={`/patients/${patient.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                      {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-surface-900">
                        {patient.first_name} {patient.last_name}
                      </h3>
                      <p className="text-sm text-surface-500">{patient.patient_id}</p>
                    </div>
                    <Badge variant={patient.client_type === 'new' ? 'success' : 'default'}>
                      {patient.client_type || 'Regular'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {patient.contact && (
                      <div className="flex items-center gap-2 text-surface-600">
                        <Phone className="w-4 h-4" />
                        <span>{patient.contact}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2 text-surface-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-center gap-2 text-surface-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{patient.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-surface-100 text-xs text-surface-400">
                    Added: {new Date(patient.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}