// Type declarations for api.js
export declare const apiClient: {
  baseURL: string;
  token: string | null;
  setToken: (token: string | null) => void;
  getAuthHeaders: () => Record<string, string>;
  request: (endpoint: string, options?: RequestInit) => Promise<any>;
  get: (endpoint: string, params?: Record<string, any>) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  patch: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
};

export declare const authAPI: {
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  verify: () => Promise<any>;
  logout: () => Promise<any>;
};

export declare const usersAPI: {
  getAll: (params?: Record<string, any>) => Promise<{ data: any[] }>;
  create: (userData: any) => Promise<any>;
  update: (id: string, userData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  toggleStatus: (id: string) => Promise<any>;
};

export declare const patientsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (patientData: any) => Promise<any>;
  update: (id: string, patientData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  getStats: () => Promise<any>;
};

export declare const appointmentsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (appointmentData: any) => Promise<any>;
  update: (id: string, appointmentData: any) => Promise<any>;
  updateStatus: (id: string, status: string) => Promise<any>;
  delete: (id: string) => Promise<any>;
  getStats: (date?: any) => Promise<any>;
};

export declare const prescriptionsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (prescriptionData: any) => Promise<any>;
  update: (id: string, prescriptionData: any) => Promise<any>;
  updateStatus: (id: string, status: string) => Promise<any>;
  delete: (id: string) => Promise<any>;
};

export declare const paymentsAPI: {
  getAll: (params?: Record<string, any>) => Promise<any>;
  getById: (id: string) => Promise<any>;
  create: (paymentData: any) => Promise<any>;
  update: (id: string, paymentData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  getStats: (date?: any) => Promise<any>;
};

export declare const inventoryAPI: {
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
};

export default apiClient;
