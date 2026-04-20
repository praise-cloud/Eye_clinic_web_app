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
import { User, Bell, Save } from 'lucide-react'
import type { Profile } from '@/types'

const profileSchema = z.object({
    full_name: z.string().min(2, 'Required'),
    phone: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

export function SettingsPage() {
    const { profile, setProfile } = useAuthStore()
    const [tab, setTab] = useState('profile')
    const [saved, setSaved] = useState(false)

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: { full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' },
    })

    const updateProfile = useMutation({
        mutationFn: async (data: ProfileForm) => {
            const { data: updated } = await supabase.from('profiles').update(data).eq('id', profile!.id).select().single()
            return updated as Profile
        },
        onSuccess: (updated) => { setProfile(updated); setSaved(true); setTimeout(() => setSaved(false), 3000) },
    })

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ]

    return (
        <div className="space-y-5 max-w-2xl">
            <div><h1 className="text-xl font-bold">Settings</h1><p className="text-sm text-muted-foreground">Manage your account preferences</p></div>

            <div className="flex gap-1 border-b">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        <t.icon className="w-3.5 h-3.5" />{t.label}
                    </button>
                ))}
            </div>

            {tab === 'profile' && (
                <Card>
                    <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
                    <CardContent>
                        {saved && <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">Profile updated successfully</div>}
                        <form onSubmit={handleSubmit(d => updateProfile.mutate(d))} className="space-y-4">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                                    {profile?.full_name?.[0]}
                                </div>
                                <div>
                                    <p className="font-semibold">{profile?.full_name}</p>
                                    <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
                                </div>
                            </div>
                            <Input label="Full Name" error={errors.full_name?.message} {...register('full_name')} />
                            <Input label="Phone Number" {...register('phone')} />
                            <div>
                                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</label>
                                <p className="mt-1 text-sm capitalize">{profile?.role} <span className="text-muted-foreground text-xs">(assigned by admin)</span></p>
                            </div>
                            <Button type="submit" loading={isSubmitting || updateProfile.isPending}><Save className="w-4 h-4" />Save Changes</Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {tab === 'notifications' && (
                <Card>
                    <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {[
                            { label: 'Appointment Reminders', desc: 'Get notified about upcoming appointments' },
                            { label: 'Low Stock Alerts', desc: 'Alerts when inventory is running low' },
                            { label: 'New Messages', desc: 'Notifications for new chat messages' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                    <p className="text-sm font-medium">{item.label}</p>
                                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                                </label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
