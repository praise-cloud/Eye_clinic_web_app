// Barrel export for all services
import * as apiModule from './api';
import authServiceModule from './authService';

export const usersAPI = apiModule.usersAPI;
export const authAPI = apiModule.authAPI;
export const patientsAPI = apiModule.patientsAPI;
export const appointmentsAPI = apiModule.appointmentsAPI;
export const prescriptionsAPI = apiModule.prescriptionsAPI;
export const paymentsAPI = apiModule.paymentsAPI;
export const inventoryAPI = apiModule.inventoryAPI;
export const apiClient = apiModule.apiClient;
export const authService = authServiceModule;
