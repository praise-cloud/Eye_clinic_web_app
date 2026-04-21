import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { notify } from '@/store/notificationStore'

export function useRealtimeNotifications() {
    const { profile } = useAuthStore()

    useEffect(() => {
        if (!profile) return

        const channels: ReturnType<typeof supabase.channel>[] = []

        // 1. New appointment booked — notify doctor
        if (profile.role === 'doctor') {
            const aptChannel = supabase
                .channel('realtime-appointments')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'appointments',
                    filter: `doctor_id=eq.${profile.id}`,
                }, (payload) => {
                    notify({
                        type: 'appointment',
                        title: 'New Appointment Booked',
                        message: 'A new appointment has been scheduled for you.',
                        link: '/doctor/appointments',
                    })
                })
                .subscribe()
            channels.push(aptChannel)

            // Appointment status changed to arrived — alert doctor
            const arrivedChannel = supabase
                .channel('realtime-arrived')
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
            channels.push(arrivedChannel)
        }

        // 2. New prescription — notify assistant
        if (profile.role === 'assistant') {
            const rxChannel = supabase
                .channel('realtime-prescriptions')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'prescriptions',
                }, () => {
                    notify({
                        type: 'prescription',
                        title: 'New Prescription',
                        message: 'A doctor has issued a new prescription.',
                        link: '/assistant/dispensing',
                    })
                })
                .subscribe()
            channels.push(rxChannel)
        }

        // 3. Low stock alert — notify assistant + admin
        if (['assistant', 'admin'].includes(profile.role)) {
            const stockChannel = supabase
                .channel('realtime-stock')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'drugs',
                }, (payload: any) => {
                    const drug = payload.new
                    if (drug?.quantity <= drug?.reorder_level && drug?.quantity >= 0) {
                        notify({
                            type: 'low_stock',
                            title: '⚠️ Low Stock Alert',
                            message: `${drug.name} is running low (${drug.quantity} ${drug.unit} remaining).`,
                            link: profile.role === 'admin' ? '/admin/inventory' : '/assistant/dispensing',
                        })
                    }
                })
                .subscribe()
            channels.push(stockChannel)
        }

        // 4. New payment — notify accountant
        if (profile.role === 'accountant') {
            const payChannel = supabase
                .channel('realtime-payments')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'payments',
                }, (payload: any) => {
                    notify({
                        type: 'payment',
                        title: 'New Payment Received',
                        message: `A payment has been recorded.`,
                        link: '/accountant/payments',
                    })
                })
                .subscribe()
            channels.push(payChannel)
        }

        // 5. New patient registered — notify admin
        if (profile.role === 'admin') {
            const patientChannel = supabase
                .channel('realtime-patients')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'patients',
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

        // 6. New chat message — notify receiver
        const msgChannel = supabase
            .channel('realtime-messages')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${profile.id}`,
            }, (payload: any) => {
                notify({
                    type: 'system',
                    title: 'New Message',
                    message: payload.new?.content?.slice(0, 60) || 'You have a new message.',
                    link: '/chat',
                })
            })
            .subscribe()
        channels.push(msgChannel)

        // 7. Glasses order ready — notify assistant
        if (profile.role === 'assistant') {
            const glassesChannel = supabase
                .channel('realtime-glasses')
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
            channels.push(glassesChannel)
        }

        return () => {
            channels.forEach(c => supabase.removeChannel(c))
        }
    }, [profile?.id, profile?.role])
}
