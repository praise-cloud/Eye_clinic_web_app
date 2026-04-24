import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { DailySummary } from '@/types'

export function ReportsPage() {
    const [range, setRange] = useState<'7' | '30' | '90'>('30')

    const { data: summaries = [], isLoading } = useQuery({
        queryKey: ['reports', range],
        queryFn: async () => {
            const start = new Date()
            start.setDate(start.getDate() - parseInt(range))
            const { data } = await supabase
                .from('daily_summary')
                .select('*')
                .gte('summary_date', start.toISOString().split('T')[0])
                .order('summary_date')
            return (data ?? []) as DailySummary[]
        },
    })

    const { data: patientGrowth = [] } = useQuery({
        queryKey: ['patient-growth', range],
        queryFn: async () => {
            const start = new Date()
            start.setDate(start.getDate() - parseInt(range))
            const { data } = await supabase
                .from('patients')
                .select('created_at')
                .gte('created_at', start.toISOString())
                .order('created_at')
            // Group by date
            const grouped: Record<string, number> = {}
                ; (data ?? []).forEach(p => {
                    const d = p.created_at.split('T')[0]
                    grouped[d] = (grouped[d] || 0) + 1
                })
            return Object.entries(grouped).map(([date, count]) => ({ date: date.slice(5), count }))
        },
    })

    const totals = summaries.reduce((acc, s) => ({
        revenue: acc.revenue + s.total_revenue,
        drug: acc.drug + s.drug_revenue,
        glasses: acc.glasses + s.glasses_revenue,
        consultation: acc.consultation + s.consultation_revenue,
        patients: acc.patients + s.new_patients + s.returning_patients,
    }), { revenue: 0, drug: 0, glasses: 0, consultation: 0, patients: 0 })

    const chartData = summaries.map(s => ({
        date: s.summary_date.slice(5),
        revenue: s.total_revenue,
        drug: s.drug_revenue,
        glasses: s.glasses_revenue,
    }))

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold">Reports</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Financial & operational overview</p>
                </div>
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                    {(['7', '30', '90'] as const).map(r => (
                        <button key={r} onClick={() => setRange(r)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-card dark:bg-slate-900 shadow-sm text-foreground900' : 'text-foreground500 hover:text-foreground700'}`}>
                            {r}d
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Total Revenue', value: formatCurrency(totals.revenue), color: 'text-emerald-600' },
                    { label: 'Drug Sales', value: formatCurrency(totals.drug), color: 'text-blue-600' },
                    { label: 'Glasses Sales', value: formatCurrency(totals.glasses), color: 'text-purple-600' },
                    { label: 'Consultations', value: formatCurrency(totals.consultation), color: 'text-amber-600' },
                    { label: 'Total Visits', value: totals.patients.toString(), color: 'text-foreground700' },
                ].map(s => (
                    <Card key={s.label}>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                            <p className={`text-base sm:text-lg font-bold ${s.color}`}>{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue chart */}
            <Card>
                <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-48" /> : chartData.length === 0 ? (
                        <p className="text-center py-10 text-sm text-muted-foreground">No data for this period</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                <Bar dataKey="drug" name="Drug" fill="#3b82f6" radius={[3, 3, 0, 0]} stackId="a" />
                                <Bar dataKey="glasses" name="Glasses" fill="#8b5cf6" radius={[3, 3, 0, 0]} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Patient growth chart */}
            {patientGrowth.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Patient Registrations</CardTitle></CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={patientGrowth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" name="Patients" stroke="#1D7FE8" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Daily breakdown table */}
            {summaries.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Daily Breakdown</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[500px]">
                                <thead className="border-b bg-slate-50">
                                    <tr>{['Date', 'Drug', 'Glasses', 'Consultation', 'Total', 'Visits'].map(h => (
                                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody className="divide-y">
                                    {[...summaries].reverse().slice(0, 20).map(s => (
                                        <tr key={s.summary_date} className="hover:bg-slate-50">
                                            <td className="px-4 py-2.5 text-xs font-medium">{s.summary_date}</td>
                                            <td className="px-4 py-2.5 text-xs">{formatCurrency(s.drug_revenue)}</td>
                                            <td className="px-4 py-2.5 text-xs">{formatCurrency(s.glasses_revenue)}</td>
                                            <td className="px-4 py-2.5 text-xs">{formatCurrency(s.consultation_revenue)}</td>
                                            <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600">{formatCurrency(s.total_revenue)}</td>
                                            <td className="px-4 py-2.5 text-xs">{s.new_patients + s.returning_patients}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
