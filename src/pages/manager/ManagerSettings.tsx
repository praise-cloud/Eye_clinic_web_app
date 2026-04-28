import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Save, User, Settings, Bell, Check } from 'lucide-react'
import { notify } from '@/store/notificationStore'
import type { Profile } from '@/types'

export function ManagerSettings() {
  const { profile, setProfile } = useAuthStore()
  const qc = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  })
  const [managerSettings, setManagerSettings] = useState({
    showDailyProfit: true,
    showStaffActivity: true,
    showRecentTransactions: true,
    emailNotifications: true,
    lowStockAlerts: false,
  })

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('No profile')
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
      
      if (error) throw error
    },
    onSuccess: () => {
      setProfile({ ...(profile as Profile), full_name: formData.full_name, phone: formData.phone })
      setIsEditing(false)
      qc.invalidateQueries({ queryKey: ['staff'] })
      notify({ type: 'system', title: 'Profile Updated', message: 'Your profile has been saved.' })
    },
    onError: (error: Error) => {
      notify({ type: 'system', title: 'Error', message: error.message })
    },
  })

  const saveManagerSettings = useMutation({
    mutationFn: async () => {
      localStorage.setItem('manager-settings', JSON.stringify(managerSettings))
    },
    onSuccess: () => {
      notify({ type: 'system', title: 'Settings Saved', message: 'Your preferences have been saved.' })
    },
  })

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    })
    setIsEditing(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Profile</CardTitle>
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => updateMutation.mutate()}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-semibold">
              {profile?.full_name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-medium">{profile?.full_name}</p>
              <Badge variant="secondary" className="mt-1 capitalize">{profile?.role}</Badge>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
              <Input
                value={formData.full_name}
                onChange={e => setFormData(f => ({ ...f, full_name: e.target.value }))}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <Input
                value={formData.phone}
                onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <Input value={(profile as any)?.email || 'N/A'} disabled className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Dashboard Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose which widgets to show on your dashboard</p>
          
          <div className="space-y-3">
            <ToggleSetting
              label="Daily Profit Overview"
              description="Show revenue breakdown by category"
              checked={managerSettings.showDailyProfit}
              onChange={v => setManagerSettings(s => ({ ...s, showDailyProfit: v }))}
            />
            <ToggleSetting
              label="Staff Activity"
              description="Show currently active staff members"
              checked={managerSettings.showStaffActivity}
              onChange={v => setManagerSettings(s => ({ ...s, showStaffActivity: v }))}
            />
            <ToggleSetting
              label="Recent Transactions"
              description="Show latest payment transactions"
              checked={managerSettings.showRecentTransactions}
              onChange={v => setManagerSettings(s => ({ ...s, showRecentTransactions: v }))}
            />
          </div>

          <Button onClick={() => saveManagerSettings.mutate()} className="mt-4">
            <Save className="w-4 h-4 mr-1" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
          
          <div className="space-y-3">
            <ToggleSetting
              label="Email Notifications"
              description="Receive daily summary via email"
              checked={managerSettings.emailNotifications}
              onChange={v => setManagerSettings(s => ({ ...s, emailNotifications: v }))}
            />
            <ToggleSetting
              label="Low Stock Alerts"
              description="Get notified when inventory is running low"
              checked={managerSettings.lowStockAlerts}
              onChange={v => setManagerSettings(s => ({ ...s, lowStockAlerts: v }))}
            />
          </div>

          <Button onClick={() => saveManagerSettings.mutate()} className="mt-4">
            <Save className="w-4 h-4 mr-1" />
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}