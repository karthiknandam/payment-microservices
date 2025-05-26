export interface AuthResponse {
  success: boolean;
  message: string;
  error: Error | string | unknown;
}
