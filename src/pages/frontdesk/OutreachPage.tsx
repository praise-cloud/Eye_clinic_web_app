import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Phone, Mail, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useClinicStore } from '@/hooks/useClinicSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import type { Patient, OutreachLog } from '@/types'

const getTemplates = (clinicName: string): Record<string, string> => ({
    appointment_reminder: `Dear {name}, this is a reminder of your appointment at ${clinicName}. Please arrive 10 minutes early. Call us for any changes.`,
    subscription_expiry: `Dear {name}, your ${clinicName} subscription is expiring soon. Please contact us to renew and continue enjoying our services.`,
    checkup_due: `Dear {name}, it's time for your routine eye checkup at ${clinicName}. Please call us to book an appointment.`,
    glasses_ready: `Dear {name}, your glasses are ready for collection at ${clinicName}. Our hours are Mon-Fri 8AM-6PM.`,
    custom: '',
})

export function OutreachPage() {
    const { profile } = useAuthStore()
    const qc = useQueryClient()
    const clinicName = useClinicStore(s => s.settings?.clinic_name || 'Eye Clinic')
    const TEMPLATES = getTemplates(clinicName)
    const [patientSearch, setPatientSearch] = useState('')
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [channel, setChannel] = useState<'sms' | 'email'>('sms')
    const [template, setTemplate] = useState('appointment_reminder')
    const [message, setMessage] = useState(TEMPLATES.appointment_reminder)
    const [sent, setSent] = useState(false)

    const { data: patients = [] } = useQuery({
        queryKey: ['patients-search', patientSearch],
        queryFn: async () => {
            const { data } = await supabase.from('patients').select('id,first_name,last_name,patient_number,phone,email,subscription_end').ilike('first_name', `%${patientSearch}%`).limit(8)
            return (data ?? []) as Patient[]
        },
        enabled: patientSearch.length > 1,
    })

    const { data: expiring = [] } = useQuery({
        queryKey: ['expiring-subscriptions'],
        queryFn: async () => {
            const { data } = await supabase.from('expiring_subscriptions').select('*').limit(20)
            return (data ?? []) as Patient[]
        },
    })

    const { data: history = [], isLoading: histLoading } = useQuery({
        queryKey: ['outreach-history'],
        queryFn: async () => {
            const { data } = await supabase.from('outreach_log').select('*, patient:patients(first_name,last_name)').order('sent_at', { ascending: false }).limit(20)
            return (data ?? []) as OutreachLog[]
        },
    })

    const sendMutation = useMutation({
        mutationFn: async () => {
            if (!selectedPatient) throw new Error('No patient selected')
            const body = message.replace('{name}', `${selectedPatient.first_name} ${selectedPatient.last_name}`)
            await supabase.from('outreach_log').insert({
                patient_id: selectedPatient.id,
                sent_by: profile!.id,
                channel,
                message_template: template,
                message_body: body,
                status: 'sent',
            })
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['outreach-history'] })
            setSent(true)
            setTimeout(() => setSent(false), 3000)
        },
    })

    const handleTemplateChange = (t: string) => {
        setTemplate(t)
        if (t !== 'custom') {
            const body = TEMPLATES[t].replace('{name}', selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : '{name}')
            setMessage(body)
        }
    }

    return (
        <div className="space-y-5">
            <div><h1 className="text-xl font-bold">Patient Outreach</h1><p className="text-sm text-muted-foreground">Send SMS or email messages to patients</p></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Send Panel */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader><CardTitle>Send Message</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {sent && <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">Message logged successfully!</div>}

                            {/* Patient search */}
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide">Patient</label>
                                <input
                                    className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    placeholder="Search patient name..."
                                    value={patientSearch}
                                    onChange={e => setPatientSearch(e.target.value)}
                                />
                                {patients.length > 0 && (
                                    <div className="mt-1 border rounded-md divide-y max-h-40 overflow-y-auto bg-background shadow-sm">
                                        {patients.map(p => (
                                            <button key={p.id} type="button"
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center justify-between"
                                                onClick={() => { setSelectedPatient(p); setPatientSearch(`${p.first_name} ${p.last_name}`) }}>
                                                <span>{p.first_name} {p.last_name}</span>
                                                <span className="text-xs text-muted-foreground">{p.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedPatient && (
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-4 text-sm">
                                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</p>
                                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                                            {selectedPatient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selectedPatient.phone}</span>}
                                            {selectedPatient.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{selectedPatient.email}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Channel */}
                            <div className="flex gap-2">
                                {(['sms', 'email'] as const).map(c => (
                                    <button key={c} onClick={() => setChannel(c)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors uppercase ${channel === c ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}>
                                        {c === 'sms' ? '📱 SMS' : '📧 Email'}
                                    </button>
                                ))}
                            </div>

                            {/* Template */}
                            <Select value={template} onValueChange={handleTemplateChange}>
                                <SelectTrigger label="Message Template"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="appointment_reminder">Appointment Reminder</SelectItem>
                                    <SelectItem value="subscription_expiry">Subscription Expiry</SelectItem>
                                    <SelectItem value="checkup_due">Checkup Due</SelectItem>
                                    <SelectItem value="glasses_ready">Glasses Ready</SelectItem>
                                    <SelectItem value="custom">Custom Message</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Message */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium uppercase tracking-wide">Message</label>
                                <textarea
                                    className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>
                            </div>

                            <Button className="w-full" onClick={() => sendMutation.mutate()} loading={sendMutation.isPending} disabled={!selectedPatient || !message.trim()}>
                                <Send className="w-4 h-4" />Send {channel.toUpperCase()}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Expiring Subscriptions */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />Expiring Soon</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            {expiring.length === 0 ? (
                                <p className="text-center py-6 text-sm text-muted-foreground">No expiring subscriptions</p>
                            ) : (
                                <div className="divide-y">
                                    {expiring.map((p: any) => (
                                        <div key={p.id} className="px-4 py-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-medium">{p.first_name} {p.last_name}</p>
                                                <Badge variant={p.days_remaining <= 7 ? 'destructive' : 'warning'} className="text-xs">
                                                    {p.days_remaining}d left
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{p.phone}</p>
                                            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full"
                                                onClick={() => { setSelectedPatient(p as Patient); setPatientSearch(`${p.first_name} ${p.last_name}`); handleTemplateChange('subscription_expiry') }}>
                                                Send Reminder
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* History */}
            <Card>
                <CardHeader><CardTitle>Recent Outreach</CardTitle></CardHeader>
                <CardContent className="p-0">
                    {histLoading ? <div className="p-4"><Skeleton className="h-32" /></div> : history.length === 0 ? (
                        <p className="text-center py-8 text-sm text-muted-foreground">No outreach history</p>
                    ) : (
                        <div className="divide-y">
                            {history.map(h => (
                                <div key={h.id} className="flex items-center justify-between px-5 py-3">
                                    <div>
                                        <p className="text-sm font-medium">{(h.patient as any)?.first_name} {(h.patient as any)?.last_name}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{h.message_body}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Badge variant="outline" className="text-xs uppercase">{h.channel}</Badge>
                                        <Badge variant={h.status === 'sent' ? 'success' : 'destructive'} className="text-xs">{h.status}</Badge>
                                        <span className="text-xs text-muted-foreground">{formatDate(h.sent_at)}</span>
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
