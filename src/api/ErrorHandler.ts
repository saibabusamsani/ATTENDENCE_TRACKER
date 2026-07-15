
import { AxiosError } from 'axios';
export interface ApiError {
  status: number | null;
  message: string;
}

export const parseApiError = (error: unknown): ApiError => {
  const axiosError = error as AxiosError<{ message?: string }>;

  if (axiosError.response) {
    return {
      status: axiosError.response.status,
      message:
        axiosError.response.data?.message ||
        'Something went wrong. Please try again.',
    };
  }

  if (axiosError.request) {
    return {
      status: null,
      message: 'Network error. Please check your connection.',
    };
  }

  return {
    status: null,
    message: axiosError.message || 'Unexpected error occurred.',
  };
};