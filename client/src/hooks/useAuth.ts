import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, profile, signOut } = useAuthStore()
  
  const logout = () => {
    signOut()
  }
  
  return {
    user,
    profile,
    logout,
    signOut
  }
}
