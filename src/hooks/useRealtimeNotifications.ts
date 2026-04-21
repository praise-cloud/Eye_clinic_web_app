import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { notify } from '@/store/notificationStore'

export function useRealtimeNotifications() {
    const { profile } = useAuthStore()

    useEffect(() => {
        if (!profile?.id || !profile?.role) return

        const channels: ReturnType<typeof supabase.channel>[] = []

        // ── EVERYONE: New chat message directed to me ──────────────────
        const msgChannel = supabase
            .channel(`msg-inbox:${profile.id}`)
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'messages',
                filter: `receiver_id=eq.${profile.id}`,
            }, (payload: any) => {
                notify({
                    type: 'system',
                    title: 'New Message',
                    message: payload.new?.content?.slice(0, 80) || 'You have a new message.',
                    link: '/chat',
                })
            })
            .subscribe()
        channels.push(msgChannel)

        // ── DOCTOR: New appointment booked for me ─────────────────────
        if (profile.role === 'doctor') {
            const aptInsert = supabase
                .channel(`apt-new:${profile.id}`)
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'appointments',
                    filter: `doctor_id=eq.${profile.id}`,
                }, () => {
                    notify({
                        type: 'appointment',
                        title: 'New Appointment',
                        message: 'A new appointment has been scheduled for you.',
                        link: '/doctor/appointments',
                    })
                })
                .subscribe()
            channels.push(aptInsert)

            // Patient arrived
            const aptArrived = supabase
                .channel(`apt-arrived:${profile.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'appointments',
                    filter: `doctor_id=eq.${profile.id}`,
                }, (payload: any) => {
                    if (payload.new?.status === 'arrived') {
                        notify({
                            type: 'appointment',
                            title: '🔔 Patient Has Arrived',
                            message: 'Your patient has arrived and is waiting.',
                            link: '/doctor/appointments',
                        })
                    }
                })
                .subscribe()
            channels.push(aptArrived)
        }

        // ── ASSISTANT: New prescription issued ────────────────────────
        if (profile.role === 'assistant') {
            const rxChannel = supabase
                .channel('rx-new')
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'prescriptions',
                }, () => {
                    notify({
                        type: 'prescription',
                        title: 'New Prescription',
                        message: 'A doctor has issued a new prescription to dispense.',
                        link: '/assistant/dispensing',
                    })
                })
                .subscribe()
            channels.push(rxChannel)

            // Glasses order ready
            const glassesReady = supabase
                .channel('glasses-ready')
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'glasses_orders',
                }, (payload: any) => {
                    if (payload.new?.status === 'ready') {
                        notify({
                            type: 'glasses',
                            title: '👓 Glasses Ready',
                            message: `Order ${payload.new.order_number} is ready for collection.`,
                            link: '/assistant/glasses-orders',
                        })
                    }
                })
                .subscribe()
            channels.push(glassesReady)
        }

        // ── ASSISTANT + ADMIN: Low stock alert ────────────────────────
        if (['assistant', 'admin'].includes(profile.role)) {
            const stockChannel = supabase
                .channel(`stock-alert:${profile.role}`)
                .on('postgres_changes', {
                    event: 'UPDATE', schema: 'public', table: 'drugs',
                }, (payload: any) => {
                    const drug = payload.new
                    if (drug?.quantity !== undefined && drug?.reorder_level !== undefined &&
                        drug.quantity <= drug.reorder_level && drug.quantity >= 0) {
                        notify({
                            type: 'low_stock',
                            title: '⚠️ Low Stock',
                            message: `${drug.name}: only ${drug.quantity} ${drug.unit}(s) left.`,
                            link: profile.role === 'admin' ? '/admin/inventory' : '/assistant/dispensing',
                        })
                    }
                })
                .subscribe()
            channels.push(stockChannel)
        }

        // ── ACCOUNTANT + ADMIN: New payment recorded ──────────────────
        if (['accountant', 'admin'].includes(profile.role)) {
            const payChannel = supabase
                .channel(`pay-new:${profile.role}`)
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'payments',
                }, (payload: any) => {
                    notify({
                        type: 'payment',
                        title: 'Payment Recorded',
                        message: `A new payment has been recorded.`,
                        link: profile.role === 'accountant' ? '/accountant/payments' : '/admin/reports',
                    })
                })
                .subscribe()
            channels.push(payChannel)
        }

        // ── ADMIN: New patient registered ─────────────────────────────
        if (profile.role === 'admin') {
            const patientChannel = supabase
                .channel('patient-new')
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'patients',
                }, (payload: any) => {
                    const p = payload.new
                    notify({
                        type: 'patient',
                        title: 'New Patient Registered',
                        message: `${p.first_name} ${p.last_name} has been registered.`,
                        link: '/admin/patients',
                    })
                })
                .subscribe()
            channels.push(patientChannel)
        }

        // ── DOCTOR + ADMIN: New case note created ─────────────────────
        if (['doctor', 'admin'].includes(profile.role)) {
            const noteChannel = supabase
                .channel(`note-new:${profile.role}`)
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'case_notes',
                }, () => {
                    if (profile.role === 'admin') {
                        notify({
                            type: 'prescription',
                            title: 'Case Note Created',
                            message: 'A doctor has written a new case note.',
                            link: '/admin/audit',
                        })
                    }
                })
                .subscribe()
            channels.push(noteChannel)
        }

        return () => {
            channels.forEach(c => supabase.removeChannel(c))
        }
    }, [profile?.id, profile?.role])
}
