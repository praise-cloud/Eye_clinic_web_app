import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Pill, Package, ClipboardList, ArrowRight, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { Prescription, PharmacyDrug } from '../../types'

export function AssistantDashboard() {
  const [pendingPrescriptions, setPendingPrescriptions] = useState<Prescription[]>([])
  const [lowStockDrugs, setLowStockDrugs] = useState<PharmacyDrug[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [prescriptionsRes, drugsRes] = await Promise.all([
        fetch('/api/prescriptions/pending'),
        fetch('/api/pharmacy/drugs/low-stock')
      ])
      
      const [prescriptionsData, drugsData] = await Promise.all([
        prescriptionsRes.json(),
        drugsRes.json()
      ])
      
      if (prescriptionsData.success) setPendingPrescriptions(prescriptionsData.data)
      if (drugsData.success) setLowStockDrugs(drugsData.data)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDispense = async (prescriptionId: string) => {
    try {
      await fetch('/api/pharmacy/dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prescriptionId })
      })
      loadDashboardData()
    } catch (error) {
      console.error('Failed to dispense:', error)
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
          <h1 className="text-2xl font-bold text-surface-900">Assistant Dashboard</h1>
          <p className="text-surface-500">Manage pharmacy and patient care</p>
        </div>
        <div className="flex gap-2">
          <Link to="/patients/new" className="btn btn-primary">
            <Users className="w-4 h-4" />
            Register Patient
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Pending Rx</p>
              <p className="text-xl font-bold text-surface-900">{pendingPrescriptions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-100 text-red-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-surface-500">Low Stock</p>
              <p className="text-xl font-bold text-surface-900">{lowStockDrugs.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pending Prescriptions</CardTitle>
            <Link to="/prescriptions" className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPrescriptions.length === 0 ? (
                <p className="text-center text-surface-500 py-4">No pending prescriptions</p>
              ) : (
                pendingPrescriptions.slice(0, 5).map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-surface-200"
                  >
                    <div>
                      <p className="font-medium text-surface-900">
                        {prescription.patient?.first_name} {prescription.patient?.last_name}
                      </p>
                      <p className="text-sm text-surface-500">
                        {prescription.drug?.drug_name} x{prescription.quantity}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDispense(prescription.id)}
                      className="btn btn-primary text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Dispense
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low Stock Alerts</CardTitle>
            <Link to="/inventory" className="text-sm text-primary-600 hover:text-primary-700">
              View Inventory
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockDrugs.length === 0 ? (
                <p className="text-center text-surface-500 py-4">All stock levels are good</p>
              ) : (
                lowStockDrugs.slice(0, 5).map((drug) => (
                  <Link
                    key={drug.id}
                    to={`/pharmacy/${drug.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50"
                  >
                    <div>
                      <p className="font-medium text-surface-900">{drug.drug_name}</p>
                      <p className="text-sm text-red-600">
                        Stock: {drug.current_quantity} (min: {drug.minimum_quantity})
                      </p>
                    </div>
                    <Badge variant="danger">Low Stock</Badge>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}