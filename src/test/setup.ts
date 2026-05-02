import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { supabase } from '@/lib/supabase'

// Test configuration
export const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  parallel: false,
}

// Test data
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'test123456',
    role: 'admin',
    full_name: 'Test Admin',
  },
  doctor: {
    email: 'doctor@test.com',
    password: 'test123456',
    role: 'doctor',
    full_name: 'Test Doctor',
  },
  frontdesk: {
    email: 'frontdesk@test.com',
    password: 'test123456',
    role: 'frontdesk',
    full_name: 'Test Frontdesk',
  },
  manager: {
    email: 'manager@test.com',
    password: 'test123456',
    role: 'manager',
    full_name: 'Test Manager',
  },
}

export const TEST_PATIENT = {
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1990-01-01',
  gender: 'male',
  phone: '+1234567890',
  email: 'john.doe@test.com',
  address: '123 Test St',
  occupation: 'Software Engineer',
  next_of_kin_name: 'Jane Doe',
  next_of_kin_phone: '+1234567891',
  allergies: 'None',
}

export const TEST_APPOINTMENT = {
  appointment_type: 'checkup',
  notes: 'Test appointment',
}

export const TEST_DRUG = {
  name: 'Test Drug',
  generic_name: 'Test Generic',
  category: 'Antibiotic',
  unit: 'tablet',
  quantity: 100,
  reorder_level: 10,
  purchase_price: 5.00,
  selling_price: 10.00,
  supplier: 'Test Supplier',
}

export const TEST_PAYMENT = {
  payment_type: 'consultation',
  amount: 50.00,
  payment_method: 'cash',
  notes: 'Test payment',
}

// Test utilities
export class TestUtils {
  static async createTestUser(userData: typeof TEST_USERS.admin) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            role: userData.role,
          },
        },
      })
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async deleteTestUser(email: string) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()
      
      if (profiles?.id) {
        await supabase.auth.admin.deleteUser(profiles.id)
      }
    } catch (error) {
      console.error('Error deleting test user:', error)
    }
  }

  static async createTestPatient(patientData: typeof TEST_PATIENT) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...patientData,
          patient_number: `TEST-${Date.now()}`,
        })
        .select()
        .single()
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  static async deleteTestPatient(patientId: string) {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId)
      return { error }
    } catch (error) {
      return { error }
    }
  }

  static async cleanupTestData() {
    try {
      // Clean up test patients
      await supabase
        .from('patients')
        .delete()
        .like('patient_number', 'TEST-%')
      
      // Clean up test payments
      await supabase
        .from('payments')
        .delete()
        .like('receipt_number', 'TEST-%')
      
      // Clean up test drugs
      await supabase
        .from('drugs')
        .delete()
        .like('name', 'Test Drug%')
      
      // Clean up test appointments
      await supabase
        .from('appointments')
        .delete()
        .like('notes', 'Test appointment%')
    } catch (error) {
      console.error('Error cleaning up test data:', error)
    }
  }

  static async waitFor(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static generateTestId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Global test setup
beforeAll(() => {
  console.log('Setting up test environment...')
  global.AbortSignal = class AbortSignal {
    static timeout() {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 0)
      return controller.signal
    }
  } as any
})

afterEach(() => {
  cleanup()
})

afterAll(async () => {
  vi.clearAllMocks()
  console.log('Cleaning up test environment...')
  await TestUtils.cleanupTestData()
  
  // Clean up test users
  for (const user of Object.values(TEST_USERS)) {
    await TestUtils.deleteTestUser(user.email)
  }
})