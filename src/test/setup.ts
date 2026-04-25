import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeAll(() => {
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

afterAll(() => {
  vi.clearAllMocks()
})