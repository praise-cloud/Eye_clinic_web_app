// API client for Eye Clinic Backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get authorization headers
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Include credentials for cookies
    headers['credentials'] = 'include';
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url);
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data?.token) {
      apiClient.setToken(response.data.token);
    }
    return response;
  },

  register: async (userData) => {
    return apiClient.post('/auth/register', userData);
  },

  verify: async () => {
    return apiClient.get('/auth/verify');
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    apiClient.setToken(null);
    return response;
  }
};

// Users API
export const usersAPI = {
  getAll: async (params = {}) => {
    return apiClient.get('/users', params);
  },

  create: async (userData) => {
    return apiClient.post('/users', userData);
  },

  update: async (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
  },

  delete: async (id) => {
    return apiClient.delete(`/users/${id}`);
  },

  toggleStatus: async (id) => {
    return apiClient.patch(`/users/${id}/toggle-active`);
  }
};

// Patients API
export const patientsAPI = {
  getAll: async (params = {}) => {
    return apiClient.get('/patients', params);
  },

  getById: async (id) => {
    return apiClient.get(`/patients/${id}`);
  },

  create: async (patientData) => {
    return apiClient.post('/patients', patientData);
  },

  update: async (id, patientData) => {
    return apiClient.put(`/patients/${id}`, patientData);
  },

  delete: async (id) => {
    return apiClient.delete(`/patients/${id}`);
  },

  getStats: async () => {
    return apiClient.get('/patients/stats');
  }
};

// Appointments API
export const appointmentsAPI = {
  getAll: async (params = {}) => {
    return apiClient.get('/appointments', params);
  },

  getById: async (id) => {
    return apiClient.get(`/appointments/${id}`);
  },

  create: async (appointmentData) => {
    return apiClient.post('/appointments', appointmentData);
  },

  update: async (id, appointmentData) => {
    return apiClient.put(`/appointments/${id}`, appointmentData);
  },

  updateStatus: async (id, status) => {
    return apiClient.patch(`/appointments/${id}/status`, { status });
  },

  delete: async (id) => {
    return apiClient.delete(`/appointments/${id}`);
  },

  getStats: async (date) => {
    return apiClient.get('/appointments/stats', date ? { date } : {});
  }
};

// Prescriptions API
export const prescriptionsAPI = {
  getAll: async (params = {}) => {
    return apiClient.get('/prescriptions', params);
  },

  getById: async (id) => {
    return apiClient.get(`/prescriptions/${id}`);
  },

  create: async (prescriptionData) => {
    return apiClient.post('/prescriptions', prescriptionData);
  },

  update: async (id, prescriptionData) => {
    return apiClient.put(`/prescriptions/${id}`, prescriptionData);
  },

  updateStatus: async (id, status) => {
    return apiClient.patch(`/prescriptions/${id}/status`, { status });
  },

  delete: async (id) => {
    return apiClient.delete(`/prescriptions/${id}`);
  }
};

// Payments API
export const paymentsAPI = {
  getAll: async (params = {}) => {
    return apiClient.get('/payments', params);
  },

  getById: async (id) => {
    return apiClient.get(`/payments/${id}`);
  },

  create: async (paymentData) => {
    return apiClient.post('/payments', paymentData);
  },

  update: async (id, paymentData) => {
    return apiClient.put(`/payments/${id}`, paymentData);
  },

  delete: async (id) => {
    return apiClient.delete(`/payments/${id}`);
  },

  getStats: async (date) => {
    return apiClient.get('/payments/stats/summary', date ? { date } : {});
  }
};

// Inventory API
export const inventoryAPI = {
  // Drugs
  getDrugs: async (params = {}) => {
    return apiClient.get('/inventory/drugs', params);
  },

  addDrug: async (drugData) => {
    return apiClient.post('/inventory/drugs', drugData);
  },

  updateDrug: async (id, drugData) => {
    return apiClient.put(`/inventory/drugs/${id}`, drugData);
  },

  // Glasses
  getGlasses: async (params = {}) => {
    return apiClient.get('/inventory/glasses', params);
  },

  addGlasses: async (glassesData) => {
    return apiClient.post('/inventory/glasses', glassesData);
  },

  updateGlasses: async (id, glassesData) => {
    return apiClient.put(`/inventory/glasses/${id}`, glassesData);
  },

  // Other items
  getOthers: async (params = {}) => {
    return apiClient.get('/inventory/others', params);
  },

  addOther: async (itemData) => {
    return apiClient.post('/inventory/others', itemData);
  },

  updateOther: async (id, itemData) => {
    return apiClient.put(`/inventory/others/${id}`, itemData);
  },

  // Low stock
  getLowStock: async () => {
    return apiClient.get('/inventory/low-stock');
  }
};

export default apiClient;
