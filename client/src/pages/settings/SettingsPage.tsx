import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Bell, Shield, Palette, Globe, Database, Save, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useForm } from 'react-hook-form'
import { formatDate } from '../../lib/utils'
import type { Profile } from '../../types'

export function SettingsPage() {
  const { profile, signOut } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const { data: clinicSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clinic_settings').select('*').single()
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }
      return data
    }
  })

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<{
    full_name: string
    email: string
    phone?: string
    current_password?: string
    new_password?: string
    confirm_password?: string
  }>()

  // Set form values when profile loads
  useState(() => {
    if (profile) {
      setValue('full_name', profile.full_name || '', { shouldValidate: false })
      setValue('email', profile.email || '', { shouldValidate: false })
      setValue('phone', profile.phone || '', { shouldValidate: false })
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('profiles').update({
        full_name: data.full_name,
        phone: data.phone || null,
      }).eq('id', profile?.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['current-user'] })
      alert('Profile updated successfully!')
    },
  })

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.auth.updateUser({
        password: data.new_password
      })
      if (error) throw error
    },
    onSuccess: () => {
      setShowPasswordModal(false)
      reset()
      alert('Password updated successfully!')
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const { error } = await supabase.from('clinic_settings').upsert(settings, {
        onConflict: 'id'
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-settings'] })
      alert('Settings updated successfully!')
    },
  })

  const handleProfileSubmit = (data: any) => {
    updateProfileMutation.mutate(data)
  }

  const handlePasswordSubmit = (data: any) => {
    if (data.new_password !== data.confirm_password) {
      alert('New passwords do not match!')
      return
    }
    updatePasswordMutation.mutate(data)
  }

  const handleSettingsSubmit = (data: any) => {
    updateSettingsMutation.mutate(data)
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'clinic', label: 'Clinic Settings', icon: Globe },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and application settings</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <Input {...register('full_name')} />
                      {errors.full_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input type="email" {...register('email')} disabled />
                      <p className="text-gray-500 text-xs mt-1">Email cannot be changed here</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <Input type="tel" {...register('phone')} />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <Button type="submit" loading={isSubmitting || updateProfileMutation.isPending}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Account Type</span>
                  <Badge variant="secondary" className="capitalize">
                    {profile?.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge variant={profile?.is_active ? 'default' : 'destructive'}>
                    {profile?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm text-gray-900">
                    {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </div>
                <div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (confirm('Are you sure you want to sign out?')) {
                        signOut()
                      }
                    }}
                  >
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Password</h3>
              <Button onClick={() => setShowPasswordModal(true)}>
                <Shield className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Login</span>
                  <span className="text-gray-900">Just now</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Device</span>
                  <span className="text-gray-900">Web Browser</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">Configure how you receive notifications from the system.</p>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Email notifications for appointments</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Email notifications for messages</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">SMS notifications</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinic Settings Tab - Only for Admin */}
      {activeTab === 'clinic' && profile?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Clinic Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(handleSettingsSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                  <Input 
                    defaultValue={clinicSettings?.clinic_name || ''} 
                    {...register('clinic_name')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <Input 
                    type="email"
                    defaultValue={clinicSettings?.contact_email || ''} 
                    {...register('contact_email')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <Input 
                    type="tel"
                    defaultValue={clinicSettings?.contact_phone || ''} 
                    {...register('contact_phone')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input 
                    defaultValue={clinicSettings?.address || ''} 
                    {...register('address')}
                  />
                </div>
                <Button type="submit" loading={updateSettingsMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  Update Clinic Settings
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Change Password Modal */}
      <Modal open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Change Password</ModalTitle>
            <ModalDescription>Enter your current and new password to update your account security.</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('current_password', { required: 'Current password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.current_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.current_password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('new_password', { required: 'New password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.new_password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  {...register('confirm_password', { required: 'Please confirm your new password' })}
                />
                {errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" loading={isSubmitting || updatePasswordMutation.isPending}>
                Update Password
              </Button>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  )
}
