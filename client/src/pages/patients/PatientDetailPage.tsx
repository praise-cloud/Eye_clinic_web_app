import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, FileText, Pill, Edit } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { Patient, Visit, Prescription, Test } from '../../types'

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [tests, setTests] = useState<Test[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (id) loadPatientData()
  }, [id])

  const loadPatientData = async () => {
    try {
      const [patientRes, visitsRes, prescriptionsRes, testsRes] = await Promise.all([
        fetch(`/api/patients/${id}`),
        fetch(`/api/visits?patient_id=${id}`),
        fetch(`/api/prescriptions?patientId=${id}`),
        fetch(`/api/tests?patient_id=${id}`)
      ])
      
      const [patientData, visitsData, prescriptionsData, testsData] = await Promise.all([
        patientRes.json(),
        visitsRes.json(),
        prescriptionsRes.json(),
        testsRes.json()
      ])
      
      if (patientData.success) setPatient(patientData.data)
      if (visitsData.success) setVisits(visitsData.data)
      if (prescriptionsData.success) setPrescriptions(prescriptionsData.data)
      if (testsData.success) setTests(testsData.data)
    } catch (error) {
      console.error('Failed to load patient:', error)
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

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-surface-900">Patient not found</h2>
        <Link to="/patients" className="btn btn-primary mt-4">Back to Patients</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'visits', name: 'Visits', count: visits.length },
    { id: 'prescriptions', name: 'Prescriptions', count: prescriptions.length },
    { id: 'tests', name: 'Tests', count: tests.length }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/patients" className="p-2 rounded-lg hover:bg-surface-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-900">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-surface-500">{patient.patient_id}</p>
        </div>
        <Link to={`/patients/${id}/edit`} className="btn btn-secondary">
          <Edit className="w-4 h-4" />
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-2xl mx-auto">
              {patient.first_name.charAt(0)}{patient.last_name.charAt(0)}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-surface-400" />
                <div>
                  <p className="text-sm text-surface-500">Name</p>
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                </div>
              </div>
              
              {patient.gender && (
                <div className="flex items-center gap-3">
                  <Badge>{patient.gender}</Badge>
                </div>
              )}
              
              {patient.dob && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-surface-400" />
                  <div>
                    <p className="text-sm text-surface-500">Date of Birth</p>
                    <p className="font-medium">{patient.dob}</p>
                  </div>
                </div>
              )}
              
              {patient.contact && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-surface-400" />
                  <div>
                    <p className="text-sm text-surface-500">Contact</p>
                    <p className="font-medium">{patient.contact}</p>
                  </div>
                </div>
              )}
              
              {patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-surface-400" />
                  <div>
                    <p className="text-sm text-surface-500">Email</p>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                </div>
              )}
              
              {patient.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-surface-400" />
                  <div>
                    <p className="text-sm text-surface-500">Address</p>
                    <p className="font-medium">{patient.address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <div className="lg:col-span-2">
          <Card>
            <div className="border-b border-surface-200">
              <div className="flex gap-4 px-4 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 text-sm font-medium border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-surface-500 hover:text-surface-700'
                    }`}
                  >
                    {tab.name}
                    {tab.count !== undefined && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-surface-100 text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <CardContent>
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-surface-500">Reason for Visit</p>
                    <p>{patient.reason_for_visit || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-surface-500">Client Type</p>
                    <p>{patient.client_type || 'Regular'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-surface-500">Intake Date</p>
                    <p>{patient.intake_date ? new Date(patient.intake_date).toLocaleDateString() : 'Not set'}</p>
                  </div>
                </div>
              )}
              
              {activeTab === 'visits' && (
                <div className="space-y-3">
                  {visits.length === 0 ? (
                    <p className="text-surface-500">No visits yet</p>
                  ) : (
                    visits.map((visit) => (
                      <div key={visit.id} className="p-3 border border-surface-200 rounded-lg">
                        <div className="flex justify-between">
                          <p className="font-medium">{visit.visit_type}</p>
                          <Badge variant={visit.payment_status === 'paid' ? 'success' : 'warning'}>
                            {visit.payment_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-surface-500">
                          {new Date(visit.visit_date).toLocaleDateString()}
                        </p>
                        {visit.reason && <p className="text-sm">{visit.reason}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  {prescriptions.length === 0 ? (
                    <p className="text-surface-500">No prescriptions</p>
                  ) : (
                    prescriptions.map((rx) => (
                      <div key={rx.id} className="p-3 border border-surface-200 rounded-lg">
                        <div className="flex justify-between">
                          <p className="font-medium">{rx.drug?.drug_name}</p>
                          <Badge variant={rx.status === 'dispensed' ? 'success' : 'warning'}>
                            {rx.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-surface-500">Qty: {rx.quantity}</p>
                        {rx.instructions && <p className="text-sm">{rx.instructions}</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {activeTab === 'tests' && (
                <div className="space-y-3">
                  {tests.length === 0 ? (
                    <p className="text-surface-500">No tests</p>
                  ) : (
                    tests.map((test) => (
                      <div key={test.id} className="p-3 border border-surface-200 rounded-lg">
                        <div className="flex justify-between">
                          <p className="font-medium">{test.machine_type || 'Visual Field Test'}</p>
                          <Badge variant={test.report_status === 'completed' ? 'success' : 'default'}>
                            {test.report_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-surface-500">
                          {new Date(test.test_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}