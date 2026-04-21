import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Bell, Shield, CheckCircle2 } from 'lucide-react'
import type { Profile } from '@/types'

const profileSchema = z.object({
    full_name: z.string().min(2, 'Required'),
    phone: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

const NOTIF_KEYS = [
    { key: 'notif_appointments', label: 'Appointment Reminders', desc: 'Get notified about upcoming appointments' },
    { key: 'notif_low_stock', label: 'Low Stock Alerts', desc: 'Alerts when inventory is running low' },
    { key: 'notif_messages', label: 'New Messages', desc: 'Notifications for new chat messages' },
    { key: 'notif_prescriptions', label: 'Prescription Alerts', desc: 'Alerts for new prescriptions to dispense' },
]

export function SettingsPage() {
    const { profile, setProfile } = useAuthStore()
    const [tab, setTab] = useState('profile')
    const [saved, setSaved] = useState(false)
    const [notifSaved, setNotifSaved] = useState(false)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' },
    })

    // Load notification settings from DB
    const { data: notifSettings, refetch: refetchNotif } = useQuery({
        queryKey: ['settings', 'notifications', profile?.id],
        queryFn: async () => {
            const { data } = await supabase.from('settings').select('key,value').in('key', NOTIF_KEYS.map(n => `${profile!.id}_${n.key}`))
            const map: Record<string, boolean> = {}
            NOTIF_KEYS.forEach(n => { map[n.key] = true }) // default all on
                ; (data ?? []).forEach(row => {
                    const key = row.key.replace(`${profile!.id}_`, '')
                    map[key] = row.value === 'true'
                })
            return map
        },
        enabled: !!profile,
    })

    const [notifState, setNotifState] = useState<Record<string, boolean>>({})
    const currentNotif = { ...Object.fromEntries(NOTIF_KEYS.map(n => [n.key, true])), ...notifSettings, ...notifState }

    const updateProfile = useMutation({
        mutationFn: async (data: ProfileForm) => {
            const { data: updated } = await supabase.from('profiles').update(data).eq('id', profile!.id).select().single()
            return updated as Profile
        },
        onSuccess: (updated) => { setProfile(updated); setSaved(true); setTimeout(() => setSaved(false), 3000) },
    })

    const saveNotifications = useMutation({
        mutationFn: async () => {
            const upserts = NOTIF_KEYS.map(n => ({
                key: `${profile!.id}_${n.key}`,
                value: String(currentNotif[n.key] ?? true),
            }))
            await supabase.from('settings').upsert(upserts, { onConflict: 'key' })
        },
        onSuccess: () => { refetchNotif(); setNotifSaved(true); setTimeout(() => setNotifSaved(false), 3000) },
    })

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ]

    return (
        <div className="space-y-5 max-w-2xl">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-500">Manage your account and preferences</p>
            </div>

            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                        <t.icon className="w-3.5 h-3.5" />{t.label}
                    </button>
                ))}
            </div>

            {tab === 'profile' && (
                <Card>
                    <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
                    <CardContent>
                        {saved && (
                            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />Profile updated successfully
                            </div>
                        )}
                        <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-slate-50">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                                {profile?.full_name?.[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">{profile?.full_name}</p>
                                <p className="text-sm text-slate-500 capitalize">{profile?.role}</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit(d => updateProfile.mutate(d))} className="space-y-4">
                            <Input label="Full Name" error={errors.full_name?.message} {...register('full_name')} />
                            <Input label="Phone Number" {...register('phone')} />
                            <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</label>
                                <p className="mt-1 text-sm text-slate-700 capitalize">{profile?.role} <span className="text-slate-400 text-xs">(assigned by admin)</span></p>
                            </div>
                            <Button type="submit" loading={isSubmitting || updateProfile.isPending}>Save Changes</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {tab === 'notifications' && (
                <Card>
                    <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {notifSaved && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4" />Preferences saved
                            </div>
                        )}
                        {NOTIF_KEYS.map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input type="checkbox"
                                        checked={currentNotif[item.key] ?? true}
                                        onChange={e => setNotifState(s => ({ ...s, [item.key]: e.target.checked }))}
                                        className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-inner" />
                                </label>
                            </div>
                        ))}
                        <Button onClick={() => saveNotifications.mutate()} loading={saveNotifications.isPending} className="mt-2">
                            Save Preferences
                        </Button>
                    </CardContent>
                </Card>
            )}

            {tab === 'security' && (
                <Card>
                    <CardHeader><CardTitle>Security</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-medium text-slate-900 mb-1">Password</p>
                            <p className="text-xs text-slate-500 mb-3">To change your password, use the "Forgot password" link on the login page.</p>
                            <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>Go to Login</Button>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                            <p className="text-sm font-medium text-slate-900 mb-1">Account Email</p>
                            <p className="text-xs text-slate-500">Contact your administrator to change your email address.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
