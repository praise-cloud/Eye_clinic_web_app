import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/authStore'
import type { Profile, UserRole } from '../types'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
    })
  })

  describe('setUser', () => {
    it('sets user and updates isAuthenticated', () => {
      const mockUser = { id: '123' } as any
      useAuthStore.getState().setUser(mockUser)
      
      expect(useAuthStore.getState().user).toEqual(mockUser)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('sets null and updates isAuthenticated to false', () => {
      useAuthStore.setState({ user: { id: '123' } as any, isAuthenticated: true })
      useAuthStore.getState().setUser(null)
      
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('setProfile', () => {
    it('sets profile', () => {
      const profile: Profile = {
        id: '123',
        full_name: 'John Doe',
        role: 'doctor' as UserRole,
        phone: '08012345678',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      useAuthStore.getState().setProfile(profile)
      
      expect(useAuthStore.getState().profile).toEqual(profile)
    })

    it('sets null profile', () => {
      useAuthStore.setState({ profile: { id: '123' } as any })
      useAuthStore.getState().setProfile(null)
      
      expect(useAuthStore.getState().profile).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('sets loading state', () => {
      useAuthStore.getState().setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)
      
      useAuthStore.getState().setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('signOut', () => {
    it('clears all auth state', () => {
      useAuthStore.setState({
        user: { id: '123' } as any,
        profile: { id: '123', role: 'doctor' as UserRole } as any,
        isAuthenticated: true,
      })
      
      useAuthStore.getState().signOut()
      
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().profile).toBeNull()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('initial state', () => {
    it('has correct initial values', () => {
      expect(useAuthStore.getState().user).toBeNull()
      expect(useAuthStore.getState().profile).toBeNull()
      expect(useAuthStore.getState().isLoading).toBe(false)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})