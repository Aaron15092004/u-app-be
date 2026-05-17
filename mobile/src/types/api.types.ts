export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  db: string;
  dbWrite: boolean;
  version: string;
  environment: string;
  timestamp: string;
  cloudinary?: boolean;
  firebase?: boolean;
}

export type ApiError = {
  message: string;
  statusCode: number;
};
