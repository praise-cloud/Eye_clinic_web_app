import { useState } from 'react'
import { User, Bell, Shield, Database, Palette, Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuthStore } from '../../stores/authStore'

export function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone_number || ''
  })
  
  const [settings, setSettings] = useState({
    clinicName: 'KORENE Eye Clinic',
    clinicEmail: 'info@clinic.com',
    clinicPhone: '+234 XXX XXX XXXX',
    address: 'Clinic Address'
  })
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    prescriptionAlerts: true,
    lowStockAlerts: true
  })

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      const data = await response.json()
      if (data.success) {
        alert('Profile updated successfully')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const data = await response.json()
      if (data.success) {
        alert('Settings saved successfully')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'clinic', name: 'Clinic Settings', icon: Database },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <Card className="lg:col-span-1">
          <div className="p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(p => ({ ...p, firstName: e.target.value }))}
                  />
                  <Input
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(p => ({ ...p, email: e.target.value }))}
                />
                <Input
                  label="Phone Number"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                  { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Get reminders for upcoming appointments' },
                  { key: 'prescriptionAlerts', label: 'Prescription Alerts', desc: 'Alerts for new prescriptions' },
                  { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Alerts when inventory is low' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-surface-200">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-surface-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[item.key as keyof typeof notifications]}
                        onChange={(e) => setNotifications(n => ({ ...n, [item.key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'clinic' && (
            <Card>
              <CardHeader>
                <CardTitle>Clinic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Clinic Name"
                  value={settings.clinicName}
                  onChange={(e) => setSettings(s => ({ ...s, clinicName: e.target.value }))}
                />
                <Input
                  label="Clinic Email"
                  type="email"
                  value={settings.clinicEmail}
                  onChange={(e) => setSettings(s => ({ ...s, clinicEmail: e.target.value }))}
                />
                <Input
                  label="Clinic Phone"
                  value={settings.clinicPhone}
                  onChange={(e) => setSettings(s => ({ ...s, clinicPhone: e.target.value }))}
                />
                <Input
                  label="Address"
                  value={settings.address}
                  onChange={(e) => setSettings(s => ({ ...s, address: e.target.value }))}
                />
                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>
                    <Save className="w-4 h-4" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}