export interface AppNotification {
  id: string
  user_id: string
  type: 'appointment' | 'prescription' | 'low_stock' | 'payment' | 'patient' | 'dispensing' | 'glasses' | 'system'
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}
