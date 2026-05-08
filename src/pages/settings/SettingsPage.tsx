import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { notify } from '@/store/notificationStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Bell, Moon, Sun, CheckCircle2, Palette, Pencil, X, Save } from 'lucide-react'
import type { Profile } from '@/types'

const profileSchema = z.object({
    full_name: z.string().min(2, 'Name is required'),
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
    const qc = useQueryClient()
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [notifState, setNotifState] = useState<Record<string, boolean>>({})

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' },
    })

    const { data: notifSettings, refetch: refetchNotif } = useQuery({
        queryKey: ['settings', 'notifications', profile?.id],
        queryFn: async () => {
            if (!profile) return {}
            const { data } = await supabase.from('settings').select('key,value').in('key', NOTIF_KEYS.map(n => `${profile.id}_${n.key}`))
            const map: Record<string, boolean> = {}
            NOTIF_KEYS.forEach(n => { map[n.key] = true })
            ; (data ?? []).forEach(row => {
                const key = row.key.replace(`${profile.id}_`, '')
                map[key] = row.value === 'true'
            })
            return map
        },
        enabled: !!profile,
    })

    const currentNotif = { ...Object.fromEntries(NOTIF_KEYS.map(n => [n.key, true])), ...notifSettings, ...notifState }

    const updateProfile = useMutation({
        mutationFn: async (data: ProfileForm) => {
            console.log('[Settings] Updating profile...', data)
            // Only send fields that exist in the form
            const updates: Partial<Profile> = {
                full_name: data.full_name,
                phone: data.phone || undefined,
            }
            console.log('[Settings] Sending updates:', updates)
            const { data: updated, error } = await supabase.from('profiles').update(updates).eq('id', profile!.id).select().maybeSingle()
            if (error) {
                console.error('[Settings] Profile update error:', error)
                throw error
            }
            console.log('[Settings] Profile updated:', updated)
            return updated as Profile
        },
        onSuccess: (updated) => {
            setProfile(updated)
            setIsEditingProfile(false)
            notify({ type: 'system', title: 'Profile Updated', message: 'Your profile has been updated successfully.', link: '/settings' }, profile?.id || '')
        },
        onError: (error: any) => {
            console.error('[Settings] Profile update failed:', error?.message || error, error)
            const msg = error?.message?.includes('timeout') || error?.message?.includes('timed out')
                ? 'Request timed out. Please check your connection and try again.'
                : error?.message || error?.error_description || 'Failed to update profile. Please try again.'
            notify({ type: 'system', title: 'Update Failed', message: msg, link: '/settings' }, profile?.id || '')
        },
    })

    const saveNotifications = useMutation({
        mutationFn: async () => {
            if (!profile) return
            const upserts = NOTIF_KEYS.map(n => ({
                key: `${profile.id}_${n.key}`,
                value: String(currentNotif[n.key] ?? true),
            }))
            const { error } = await supabase.from('settings').upsert(upserts, { onConflict: 'key' })
            if (error) throw error
        },
        onSuccess: () => {
            refetchNotif()
            notify({ type: 'system', title: 'Preferences Saved', message: 'Your notification preferences have been saved.', link: '/settings' }, profile?.id || '')
        },
        onError: (error: any) => {
            console.error('Notification save failed:', error?.message || error)
            notify({ type: 'system', title: 'Save Failed', message: error?.message || 'Failed to save notification preferences.', link: '/settings' }, profile?.id || '')
        },
    })

    const handleThemeToggle = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
    }

    const startEditing = () => {
        reset({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
        setIsEditingProfile(true)
    }

    const cancelEditing = () => {
        setIsEditingProfile(false)
        reset({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Card */}
                <Card className="overflow-hidden">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                <CardTitle>Profile</CardTitle>
                            </div>
                            {!isEditingProfile ? (
                                <Button variant="ghost" size="sm" onClick={startEditing} className="gap-1.5">
                                    <Pencil className="w-3.5 h-3.5" />Edit
                                </Button>
                            ) : (
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={cancelEditing} className="gap-1.5">
                                        <X className="w-3.5 h-3.5" />Cancel
                                    </Button>
                                </div>
                            )}
                        </div>
                        <CardDescription>Your personal information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground">{profile?.full_name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
                            </div>
                        </div>

                        {isEditingProfile ? (
                            <form onSubmit={handleSubmit(d => updateProfile.mutate(d))} className="space-y-4">
                                <Input label="Full Name" error={errors.full_name?.message} {...register('full_name')} />
                                <Input label="Phone Number" {...register('phone')} />
                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" loading={isSubmitting || updateProfile.isPending} className="gap-1.5">
                                        <Save className="w-4 h-4" />Save Changes
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</label>
                                    <p className="text-sm text-foreground mt-1">{profile?.full_name || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</label>
                                    <p className="text-sm text-foreground mt-1">{profile?.phone || 'Not set'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</label>
                                    <p className="text-sm text-foreground mt-1">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</label>
                                    <p className="text-sm text-foreground mt-1 capitalize">{profile?.role} <span className="text-muted-foreground/60 text-xs">(assigned by admin)</span></p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Appearance Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            <CardTitle>Appearance</CardTitle>
                        </div>
                        <CardDescription>Customize how the app looks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/30 transition-colors cursor-pointer"
                            onClick={handleThemeToggle}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                                    {theme === 'light' ? (
                                        <Sun className="w-5 h-5 text-amber-500" />
                                    ) : (
                                        <Moon className="w-5 h-5 text-indigo-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Theme</p>
                                    <p className="text-xs text-muted-foreground capitalize">{theme === 'light' ? 'Light mode' : 'Dark mode'}</p>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full flex items-center px-0.5 transition-all ${theme === 'dark' ? 'bg-primary' : 'bg-muted'}`}>
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${theme !== 'dark' ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                                onClick={() => theme === 'dark' && handleThemeToggle()}>
                                <div className="rounded-lg bg-card border border-border overflow-hidden">
                                    <div className="h-6 bg-slate-100 border-b border-slate-200 flex items-center gap-1 px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <div className="h-1.5 w-3/4 bg-slate-200 rounded" />
                                        <div className="h-1.5 w-1/2 bg-slate-200 rounded" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-center mt-2 text-foreground">Light</p>
                            </div>
                            <div className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${theme === 'dark' ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                                onClick={() => theme !== 'dark' && handleThemeToggle()}>
                                <div className="rounded-lg bg-slate-900 border border-slate-700 overflow-hidden">
                                    <div className="h-6 bg-slate-800 border-b border-slate-700 flex items-center gap-1 px-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    </div>
                                    <div className="p-2 space-y-1">
                                        <div className="h-1.5 w-3/4 bg-slate-700 rounded" />
                                        <div className="h-1.5 w-1/2 bg-slate-700 rounded" />
                                    </div>
                                </div>
                                <p className="text-xs font-medium text-center mt-2 text-foreground">Dark</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-primary" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>Manage how you receive notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {NOTIF_KEYS.map(item => (
                            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input type="checkbox"
                                        checked={currentNotif[item.key] ?? true}
                                        onChange={e => setNotifState(s => ({ ...s, [item.key]: e.target.checked }))}
                                        className="sr-only peer" />
                                    <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 shadow-inner" />
                                </label>
                            </div>
                        ))}
                        <Button onClick={() => saveNotifications.mutate()} loading={saveNotifications.isPending} className="w-full mt-2 gap-1.5">
                            <Save className="w-4 h-4" />Save Preferences
                        </Button>
                    </CardContent>
                </Card>

                {/* Account Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            <CardTitle>Account</CardTitle>
                        </div>
                        <CardDescription>Your account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 rounded-xl border border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                            <p className="text-xs text-muted-foreground mt-1">Contact admin to change email</p>
                        </div>
                        <div className="p-4 rounded-xl border border-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Member Since</p>
                            <p className="text-sm text-foreground">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}