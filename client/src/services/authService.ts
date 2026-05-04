import { authAPI } from './api.js';

interface LoginResponse {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
}

interface VerifyTokenResponse {
  success: boolean;
  user?: any;
  error?: string;
}

interface LogoutResponse {
  success: boolean;
}

export class AuthService {
  // Login user
  static async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data?.token) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('auth_token', response.data.token);
        
        return {
          success: true,
          user: response.data.user,
          token: response.data.token
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  // Register user
  static async register(userData: any): Promise<any> {
    try {
      const response = await authAPI.register(userData);
      return response;
    } catch (error: any) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  // Verify token and get current user
  static async verifyToken(): Promise<VerifyTokenResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return { success: false, error: 'No token found' };
      }

      const response = await authAPI.verify();
      
      if (response.success && response.data?.user) {
        // Update stored user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return {
          success: true,
          user: response.data.user
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('Token verification error:', error);
      // Clear invalid token
      this.logout();
      return {
        success: false,
        error: error.message || 'Token verification failed'
      };
    }
  }

  // Logout user
  static async logout(): Promise<LogoutResponse> {
    try {
      await authAPI.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    
    return { success: true };
  }

  // Get current user from localStorage
  static getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Get current token
  static getToken() {
    return localStorage.getItem('auth_token');
  }

  // Check if user is authenticated
  static isAuthenticated() {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  // Check user role
  static hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  static hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user && roles.includes(user.role);
  }

  // Check if user is admin
  static isAdmin() {
    return this.hasRole('admin');
  }

  // Check if user is doctor
  static isDoctor() {
    return this.hasRole('doctor');
  }

  // Check if user is frontdesk
  static isFrontdesk() {
    return this.hasRole('frontdesk');
  }

  // Check if user is manager
  static isManager() {
    return this.hasRole('manager');
  }

  // Get user initials for avatar
  static getUserInitials(user = null) {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser?.full_name) return 'U';
    
    const names = currentUser.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  }

  // Get dashboard path for user role
  static getDashboardPath(user = null) {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return '/login';
    
    const rolePaths: Record<string, string> = {
      admin: '/admin',
      doctor: '/doctor',
      frontdesk: '/frontdesk',
      manager: '/manager'
    };
    
    return rolePaths[currentUser.role as string] || '/login';
  }
}

export default AuthService;
