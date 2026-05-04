import * as apiModule from './api.js';
import * as authServiceModule from './authService';

// Re-export with proper types
export const usersAPI: {
  getAll: (params?: Record<string, any>) => Promise<{ data: any[] }>;
  create: (userData: any) => Promise<any>;
  update: (id: string, userData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  toggleStatus: (id: string) => Promise<any>;
} = apiModule.usersAPI;

export const authAPI: {
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  verify: () => Promise<any>;
  logout: () => Promise<any>;
} = apiModule.authAPI;

export const patientsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (patientData: any) => Promise<any>;
  update: (id: string, patientData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  getStats: () => Promise<any>;
} = apiModule.patientsAPI;

export const appointmentsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (appointmentData: any) => Promise<any>;
  update: (id: string, appointmentData: any) => Promise<any>;
  updateStatus: (id: string, status: string) => Promise<any>;
  delete: (id: string) => Promise<any>;
  getStats: (date?: any) => Promise<any>;
} = apiModule.appointmentsAPI;

export const prescriptionsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (prescriptionData: any) => Promise<any>;
  update: (id: string, prescriptionData: any) => Promise<any>;
  updateStatus: (id: string, status: string) => Promise<any>;
  delete: (id: string) => Promise<any>;
} = apiModule.prescriptionsAPI;

export const paymentsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (paymentData: any) => Promise<any>;
  update: (id: string, paymentData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  getStats: (date?: any) => Promise<any>;
} = apiModule.paymentsAPI;

export const inventoryAPI: {
  getDrugs: (params?: Record<string, any>) => Promise<any>;
  addDrug: (drugData: any) => Promise<any>;
  updateDrug: (id: string, drugData: any) => Promise<any>;
  getGlasses: (params?: Record<string, any>) => Promise<any>;
  addGlasses: (glassesData: any) => Promise<any>;
  updateGlasses: (id: string, glassesData: any) => Promise<any>;
  getOthers: (params?: Record<string, any>) => Promise<any>;
  addOther: (itemData: any) => Promise<any>;
  updateOther: (id: string, itemData: any) => Promise<any>;
  getLowStock: () => Promise<any>;
} = apiModule.inventoryAPI;

export const apiClient = apiModule.apiClient;
export const authService = authServiceModule;
