declare module './api.js' {
  export const usersAPI: {
    getAll: (params?: any) => Promise<{ data: any[] }>
    create: (data: any) => Promise<any>
    update: (id: string, data: any) => Promise<any>
    delete: (id: string) => Promise<any>
    toggleStatus: (id: string) => Promise<any>
  }
  export const authAPI: {
    login: (email: string, password: string) => Promise<any>
    register: (userData: any) => Promise<any>
    verify: () => Promise<any>
    logout: () => Promise<any>
  }
  export const patientsAPI: {
    getAll: (params?: any) => Promise<any>
    getById: (id: string) => Promise<any>
    create: (patientData: any) => Promise<any>
    update: (id: string, patientData: any) => Promise<any>
    delete: (id: string) => Promise<any>
    getStats: () => Promise<any>
  }
  export const appointmentsAPI: {
    getAll: (params?: any) => Promise<any>
    getById: (id: string) => Promise<any>
    create: (appointmentData: any) => Promise<any>
    update: (id: string, appointmentData: any) => Promise<any>
    updateStatus: (id: string, status: string) => Promise<any>
    delete: (id: string) => Promise<any>
    getStats: (date?: any) => Promise<any>
  }
  export const prescriptionsAPI: {
    getAll: (params?: any) => Promise<any>
    getById: (id: string) => Promise<any>
    create: (prescriptionData: any) => Promise<any>
    update: (id: string, prescriptionData: any) => Promise<any>
    updateStatus: (id: string, status: string) => Promise<any>
    delete: (id: string) => Promise<any>
  }
  export const paymentsAPI: {
    getAll: (params?: any) => Promise<any>
    getById: (id: string) => Promise<any>
    create: (paymentData: any) => Promise<any>
    update: (id: string, paymentData: any) => Promise<any>
    delete: (id: string) => Promise<any>
    getStats: (date?: any) => Promise<any>
  }
  export const inventoryAPI: {
    getDrugs: (params?: any) => Promise<any>
    addDrug: (drugData: any) => Promise<any>
    updateDrug: (id: string, drugData: any) => Promise<any>
    getGlasses: (params?: any) => Promise<any>
    addGlasses: (glassesData: any) => Promise<any>
    updateGlasses: (id: string, glassesData: any) => Promise<any>
    getOthers: (params?: any) => Promise<any>
    addOther: (itemData: any) => Promise<any>
    updateOther: (id: string, itemData: any) => Promise<any>
    getLowStock: () => Promise<any>
  }
  export const apiClient: any
}

declare module './authService.js' {
  export class AuthService {
    login(credentials: any): Promise<any>
    logout(): Promise<void>
    getCurrentUser(): Promise<any>
  }
  export default AuthService
}
