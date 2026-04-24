import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Bell, Shield, Moon, Sun, CheckCircle2, Palette } from 'lucide-react'
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
    const { theme, setTheme } = useUIStore()
    const { user } = useAuthStore()
    const [tab, setTab] = useState('profile')
    const [saved, setSaved] = useState(false)
    const [notifSaved, setNotifSaved] = useState(false)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' },
    })

    const { data: notifSettings, refetch: refetchNotif } = useQuery({
        queryKey: ['settings', 'notifications', profile?.id],
        queryFn: async () => {
            const { data } = await supabase.from('settings').select('key,value').in('key', NOTIF_KEYS.map(n => `${profile!.id}_${n.key}`))
            const map: Record<string, boolean> = {}
            NOTIF_KEYS.forEach(n => { map[n.key] = true })
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
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ]

    const handleThemeToggle = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and settings</p>
            </div>

            <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                        <t.icon className="w-4 h-4" />{t.label}
                    </button>
                ))}
            </div>

            {tab === 'profile' && (
                <Card className="overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-primary to-primary/80"></div>
                    <CardContent className="-mt-12 pb-6">
                        {saved && (
                            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />Profile updated successfully
                            </div>
                        )}
                        <div className="flex items-end gap-5 mb-6">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-3xl font-bold shadow-lg -mt-2">
                                {profile?.full_name?.[0]}
                            </div>
                            <div className="flex-1 pb-2">
                                <p className="text-xl font-semibold text-foreground">{profile?.full_name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{profile?.role} · {user?.email}</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit(d => updateProfile.mutate(d))} className="grid grid-cols-2 gap-4">
                            <Input label="Full Name" error={errors.full_name?.message} {...register('full_name')} />
                            <Input label="Phone Number" {...register('phone')} />
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</label>
                                <p className="mt-1 text-sm text-foreground capitalize">{profile?.role} <span className="text-muted-foreground/60 text-xs ml-1">(assigned by admin)</span></p>
                            </div>
                            <Button type="submit" loading={isSubmitting || updateProfile.isPending} className="col-span-2 sm:col-span-1">Save Changes</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {tab === 'appearance' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize how the app looks and feels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-5 rounded-xl border border-border hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={handleThemeToggle}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                    {theme === 'light' ? (
                                        <Sun className="w-6 h-6 text-amber-500" />
                                    ) : (
                                        <Moon className="w-6 h-6 text-indigo-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Theme</p>
                                    <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
                                </div>
                            </div>
                            <div className={`w-14 h-8 rounded-full flex items-center px-1 transition-all ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${theme !== 'dark' ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                                onClick={() => theme !== 'dark' && handleThemeToggle()}>
                                <div className="rounded-lg bg-card border border-border overflow-hidden">
                                    <div className="h-8 bg-slate-100 border-b border-slate-200 flex items-center gap-1 px-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <div className="h-2 w-3/4 bg-slate-200 rounded" />
                                        <div className="h-2 w-1/2 bg-slate-200 rounded" />
                                        <div className="h-2 w-2/3 bg-slate-200 rounded" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-center mt-2 text-foreground">Light</p>
                            </div>
                            <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}
                                onClick={() => theme === 'dark' && handleThemeToggle()}>
                                <div className="rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
                                    <div className="h-8 bg-slate-800 border-b border-slate-700 flex items-center gap-1 px-2">
                                        <div className="w-2 h-2 rounded-full bg-red-400" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                        <div className="w-2 h-2 rounded-full bg-green-400" />
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <div className="h-2 w-3/4 bg-slate-700 rounded" />
                                        <div className="h-2 w-1/2 bg-slate-700 rounded" />
                                        <div className="h-2 w-2/3 bg-slate-700 rounded" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-center mt-2 text-foreground">Dark</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {tab === 'notifications' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Manage how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {notifSaved && (
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />Preferences saved
                            </div>
                        )}
                        {NOTIF_KEYS.map(item => (
                            <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input type="checkbox"
                                        checked={currentNotif[item.key] ?? true}
                                        onChange={e => setNotifState(s => ({ ...s, [item.key]: e.target.checked }))}
                                        className="sr-only peer" />
                                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-inner" />
                                </label>
                            </div>
                        ))}
                        <Button onClick={() => saveNotifications.mutate()} loading={saveNotifications.isPending} className="w-full mt-2">
                            Save Preferences
                        </Button>
                    </CardContent>
                </Card>
            )}

            {tab === 'security' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Manage your account security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-5 rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Password</p>
                                    <p className="text-xs text-muted-foreground">Last changed recently</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">To change your password, use the "Forgot password" link on the login page.</p>
                            <Button variant="outline" size="sm" onClick={() => window.location.href = '/login'}>Change Password</Button>
                        </div>
                        <div className="p-5 rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Account Email</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Contact your administrator to change your email address.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}