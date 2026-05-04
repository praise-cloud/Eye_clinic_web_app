// Type declarations for authService.js
declare class AuthService {
  login(credentials: any): Promise<any>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<any>;
}

export default AuthService;
