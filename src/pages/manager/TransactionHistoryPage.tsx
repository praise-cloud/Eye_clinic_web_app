import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Download, Filter, DollarSign, Calendar as CalendarIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

interface Payment {
  id: string
  receipt_number: string
  patient_id: string
  payment_type: string
  reference_id: string | null
  amount: number
  payment_method: string | null
  received_by: string
  notes: string | null
  paid_at: string
  patient?: {
    first_name: string
    last_name: string
  }
  profiles?: {
    full_name: string
  }
}

export function TransactionHistoryPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['transactions', typeFilter, dateFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*, patient:patients(first_name, last_name), profiles!received_by(full_name)', { count: 'exact' })
        .order('paid_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (dateFilter === 'today') {
        const today = format(new Date(), 'yyyy-MM-dd')
        query = query.gte('paid_at', `${today}T00:00:00`).lte('paid_at', `${today}T23:59:59`)
      } else if (dateFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('paid_at', weekAgo.toISOString())
      } else if (dateFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('paid_at', monthAgo.toISOString())
      }

      if (typeFilter !== 'all') {
        query = query.eq('payment_type', typeFilter)
      }

      const { data, count } = await query
      return { data: data || [], count: count || 0 }
    },
  })

  const filteredPayments = payments.data?.filter(p => {
    if (!search) return true
    const patientName = `${p.patient?.first_name} ${p.patient?.last_name}`.toLowerCase()
    const receiptNumber = p.receipt_number?.toLowerCase() || ''
    return patientName.includes(search.toLowerCase()) || receiptNumber.includes(search.toLowerCase())
  }) || []

  const getCategoryLabel = (type: string) => {
    const labels: Record<string, string> = {
      consultation: 'Consultation',
      drug: 'Pharmacy',
      glasses_deposit: 'Glasses (Deposit)',
      glasses_balance: 'Glasses (Balance)',
      subscription: 'Subscription',
      other: 'Other',
    }
    return labels[type] || type
  }

  const getCategoryColor = (type: string) => {
    const colors: Record<string, string> = {
      consultation: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      drug: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      glasses_deposit: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      glasses_balance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      subscription: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      other: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
    }
    return colors[type] || 'bg-slate-100 text-slate-700'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground">{payments.count} transactions</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="text-lg font-bold">{filteredPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or receipt number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="drug">Pharmacy</SelectItem>
                <SelectItem value="glasses_deposit">Glasses (Deposit)</SelectItem>
                <SelectItem value="glasses_balance">Glasses (Balance)</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground/30" />
              <p className="mt-2 text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-medium">Receipt #</th>
                      <th className="text-left py-3 px-4 font-medium">Patient</th>
                      <th className="text-left py-3 px-4 font-medium">Type</th>
                      <th className="text-left py-3 px-4 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 font-medium">Method</th>
                      <th className="text-left py-3 px-4 font-medium">Received By</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => (
                      <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {payment.receipt_number}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/patients/${payment.patient_id}`}
                            className="text-sm font-medium hover:text-primary"
                          >
                            {payment.patient?.first_name} {payment.patient?.last_name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(payment.payment_type)}`}>
                            {getCategoryLabel(payment.payment_type)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {payment.payment_method || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {payment.profiles?.full_name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {format(new Date(payment.paid_at), 'MMM d, yyyy h:mm a')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, payments.count)} of {payments.count}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= payments.count}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}