import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserCheck, UserX, Trash2, AlertTriangle, Pencil } from 'lucide-react'
import { usersAPI } from '../../services/services'
import { useAuthStore } from '../../store/authStore'
import { notify } from '../../store/notificationStore'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '../../components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getRoleColor, getRoleAccent, getInitials } from '../../lib/utils'
import type { Profile } from '../../types'

const schema = z.object({
  full_name: z.string().min(2, 'Required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters').optional(),
  role: z.enum(['doctor', 'frontdesk', 'admin', 'manager']),
  phone: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function UsersPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const { user: currentUser } = useAuthStore()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getAll(),
    select: (response) => response.data || [],
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      role: 'frontdesk',
      phone: '',
    },
  })

  // Reset form when modal closes
  const resetForm = () => {
    form.reset()
    setError('')
    setEditTarget(null)
  }

  // Set form values when editing
  useEffect(() => {
    if (editTarget) {
      form.setValue('full_name', editTarget.full_name || '')
      form.setValue('email', editTarget.email || '')
      form.setValue('role', editTarget.role)
      form.setValue('phone', editTarget.phone || '')
    }
  }, [editTarget, form.setValue])

  const createMutation = useMutation({
    mutationFn: (data: FormData) => usersAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setOpen(false)
      resetForm()
      notify({ 
        type: 'system', 
        title: 'User Created', 
        message: 'A new user account has been created.' 
      })
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: FormData & { id: string }) => usersAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setEditTarget(null)
      resetForm()
      notify({ 
        type: 'system', 
        title: 'User Updated', 
        message: 'User account has been updated.' 
      })
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: usersAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setDeleteTarget(null)
      notify({ 
        type: 'system', 
        title: 'User Deleted', 
        message: 'User account has been permanently deleted.' 
      })
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to delete user')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: usersAPI.toggleStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update user status')
    },
  })

  const onSubmit = async (data: FormData) => {
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500">{users.length} staff members</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setError(''); setOpen(true) }} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /><span className="hidden sm:inline">Add Staff</span><span className="sm:hidden">Add</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map((user: Profile) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm ${getRoleAccent(user.role)}`}>
                  {getInitials(user.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{user.full_name}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getRoleColor(user.role)} text-xs font-medium`}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.is_active ? 'default' : 'destructive'} className="text-xs">
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditTarget(user)}
                    disabled={!currentUser?.is_active}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                                        onClick={() => {
  toggleActiveMutation.mutate(user.id)
}}
                    disabled={!currentUser?.is_active}
                  >
                    {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(user)}
                    disabled={!currentUser?.is_active}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {users.length === 0 && <div className="text-center py-16 text-gray-400">No staff members yet</div>}
        </div>
      )}

      {/* Create/Edit User Modal */}
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{editTarget ? 'Edit Staff' : 'Add New Staff'}</ModalTitle>
            <ModalDescription>
              {editTarget ? 'Update staff account information.' : 'Create a new staff account with access to the clinic management system.'}
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  id="full_name"
                  placeholder="Enter full name"
                  {...form.register('full_name')}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                {form.formState.errors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  {...form.register('email')}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              {!editTarget && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    {...form.register('password')}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <Select value={form.watch('role')} onValueChange={(value: 'doctor' | 'frontdesk' | 'admin' | 'manager') => form.setValue('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="frontdesk">Front Desk</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.role.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  {...form.register('phone')}
                  disabled={createMutation.isPending || updateMutation.isPending}
                />
                {form.formState.errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={createMutation.isPending || updateMutation.isPending}>
              Cancel
            </Button>
            <Button 
              loading={createMutation.isPending || updateMutation.isPending}
              onClick={form.handleSubmit(onSubmit)}
            >
              {editTarget ? 'Update User' : 'Create User'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />Delete Account
            </ModalTitle>
            <ModalDescription>
              This will permanently delete <strong>{deleteTarget?.full_name}</strong>'s account and remove all their data from the system. This action cannot be undone.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              loading={deleteMutation.isPending}
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete Permanently
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
