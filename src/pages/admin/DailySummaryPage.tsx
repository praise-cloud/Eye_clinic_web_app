import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DailySummary } from '@/types'

export function DailySummaryPage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const { data: summary, isLoading } = useQuery({
        queryKey: ['daily-summary', date],
        queryFn: async () => {
            const { data } = await supabase.from('daily_summary').select('*').eq('summary_date', date).single()
            return data as DailySummary | null
        },
    })

    const { data: monthlyData = [] } = useQuery({
        queryKey: ['monthly-revenue'],
        queryFn: async () => {
            const start = new Date(); start.setDate(1)
            const { data } = await supabase.from('daily_summary').select('*').gte('summary_date', start.toISOString().split('T')[0]).order('summary_date')
            return (data ?? []) as DailySummary[]
        },
    })

    const breakdown = [
        { label: 'Drug Sales', value: summary?.drug_revenue ?? 0, color: '#1D7FE8' },
        { label: 'Glasses Sales', value: summary?.glasses_revenue ?? 0, color: '#4F46E5' },
        { label: 'Consultation', value: summary?.consultation_revenue ?? 0, color: '#059669' },
        { label: 'Subscriptions', value: summary?.subscription_revenue ?? 0, color: '#F59E0B' },
    ]

    return (
        <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div><h1 className="text-xl font-bold">Daily Summary</h1></div>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}</div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {breakdown.map(b => (
                            <Card key={b.label}>
                                <CardContent className="p-4">
                                    <p className="text-xs text-muted-foreground mb-1">{b.label}</p>
                                    <p className="text-xl font-bold" style={{ color: b.color }}>{formatCurrency(b.value)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Total + Patient Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <Card>
                            <CardHeader><CardTitle>Revenue Breakdown</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {breakdown.map(b => (
                                    <div key={b.label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
                                            <span className="text-sm">{b.label}</span>
                                        </div>
                                        <span className="text-sm font-medium">{formatCurrency(b.value)}</span>
                                    </div>
                                ))}
                                <div className="pt-3 border-t flex items-center justify-between">
                                    <span className="font-semibold">Total Revenue</span>
                                    <span className="text-lg font-bold text-emerald-600">{formatCurrency(summary?.total_revenue ?? 0)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Patient Statistics</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                {[
                                    { label: 'New Patients', value: summary?.new_patients ?? 0 },
                                    { label: 'Returning Patients', value: summary?.returning_patients ?? 0 },
                                    { label: 'Total Visits', value: (summary?.new_patients ?? 0) + (summary?.returning_patients ?? 0) },
                                ].map(s => (
                                    <div key={s.label} className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{s.label}</span>
                                        <span className="text-lg font-bold">{s.value}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Monthly Chart */}
                    {monthlyData.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle>Monthly Revenue Trend</CardTitle></CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={monthlyData.map(d => ({ date: d.summary_date.slice(5), total: d.total_revenue }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                        <Bar dataKey="total" fill="#1D7FE8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {!summary && <Card><CardContent className="text-center py-10 text-muted-foreground">No data for {formatDate(date)}</CardContent></Card>}
                </>
            )}
        </div>
    )
}
