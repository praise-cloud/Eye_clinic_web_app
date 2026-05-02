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
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
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
                    event: 'INSERT',
                    schema: 'public',
                    table: 'appointments',
                    filter: `doctor_id=eq.${profile.id}`,
                }, () => {
                    notify({
                        type: 'appointment',
                        title: 'New Appointment Booked',
                        message: 'A new appointment has been scheduled for you.',
                        link: '/doctor/appointments',
                    })
                })
                .subscribe()
            channels.push(aptInsert)

            // Patient arrived — alert doctor
            const aptArrived = supabase
                .channel(`apt-arrived:${profile.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'appointments',
                    filter: `doctor_id=eq.${profile.id}`,
                }, (payload: any) => {
                    if (payload.new?.status === 'arrived') {
                        notify({
                            type: 'appointment',
                            title: '🔔 Patient Has Arrived',
                            message: 'Your patient has arrived and is waiting for you.',
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
                .channel(`rx-new:${profile.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'prescriptions',
                }, () => {
                    notify({
                        type: 'prescription',
                        title: 'New Prescription',
                        message: 'A doctor has issued a new prescription.',
                        link: '/assistant/prescriptions',
                    })
                })
                .subscribe()
            channels.push(rxChannel)

            // Glasses order ready
            const glassesReady = supabase
                .channel(`glasses-ready:${profile.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'glasses_orders',
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

        // ── ASSISTANT + ADMIN: Low stock alerts ───────────────────────
        if (['assistant', 'admin'].includes(profile.role)) {
            const inventoryLink = profile.role === 'admin' ? '/admin/inventory' : '/assistant/inventory'

            // Drug low stock
            const stockChannel = supabase
                .channel(`stock-alert:${profile.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'drugs',
                }, (payload: any) => {
                    const drug = payload.new
                    const oldDrug = payload.old
                    const newQty = Number(drug?.quantity ?? 0)
                    const oldQty = Number(oldDrug?.quantity ?? newQty + 1)
                    const reorderLevel = Number(drug?.reorder_level ?? 10)

                    if (newQty === 0) {
                        notify({
                            type: 'low_stock',
                            title: '🚨 Out of Stock',
                            message: `${drug.name} is now completely out of stock!`,
                            link: inventoryLink,
                        })
                    } else if (newQty <= reorderLevel && oldQty > reorderLevel) {
                        notify({
                            type: 'low_stock',
                            title: '⚠️ Low Stock Alert',
                            message: `${drug.name}: only ${newQty} ${drug.unit || 'units'} left (min: ${reorderLevel}).`,
                            link: inventoryLink,
                        })
                    }
                })
                .subscribe()
            channels.push(stockChannel)

            // Glasses frame low stock
            const glassesStockChannel = supabase
                .channel(`glasses-stock:${profile.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'glasses_inventory',
                }, (payload: any) => {
                    const frame = payload.new
                    const oldFrame = payload.old
                    const newQty = Number(frame?.quantity ?? 0)
                    const oldQty = Number(oldFrame?.quantity ?? newQty + 1)
                    const reorderLevel = Number(frame?.reorder_level ?? 5)

                    if (newQty === 0) {
                        notify({
                            type: 'low_stock',
                            title: '🚨 Glasses Out of Stock',
                            message: `${frame.frame_name} is now out of stock!`,
                            link: inventoryLink,
                        })
                    } else if (newQty <= reorderLevel && oldQty > reorderLevel) {
                        notify({
                            type: 'low_stock',
                            title: '⚠️ Low Glasses Stock',
                            message: `${frame.frame_name}: only ${newQty} left (min: ${reorderLevel}).`,
                            link: inventoryLink,
                        })
                    }
                })
                .subscribe()
            channels.push(glassesStockChannel)
        }

        // ── ACCOUNTANT + ADMIN: New payment ───────────────────────────
        if (['accountant', 'admin'].includes(profile.role)) {
            const payChannel = supabase
                .channel(`pay-new:${profile.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'payments',
                }, () => {
                    notify({
                        type: 'payment',
                        title: 'New Payment Recorded',
                        message: 'A new payment has been recorded.',
                        link: profile.role === 'accountant' ? '/accountant/payments' : '/admin/reports',
                    })
                })
                .subscribe()
            channels.push(payChannel)
        }

        // ── ADMIN: New patient registered ─────────────────────────────
        if (profile.role === 'admin') {
            const patientChannel = supabase
                .channel(`patient-new:${profile.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'patients',
                }, (payload: any) => {
                    const p = payload.new
                    notify({
                        type: 'patient',
                        title: 'New Patient Registered',
                        message: `${p.first_name} ${p.last_name} (${p.patient_number}) has been registered.`,
                        link: '/admin/patients',
                    })
                })
                .subscribe()
            channels.push(patientChannel)
        }

        return () => {
            channels.forEach(c => supabase.removeChannel(c))
        }
    }, [profile?.id, profile?.role])
}
