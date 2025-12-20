// src/lib/api-utils.ts
// Centralized API utilities for standardized error handling and responses

import toast from 'react-hot-toast';

// Standard API response format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Standard error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  CART_UPDATE_FAILED: 'Failed to update cart. Please try again.',
  CART_ADD_FAILED: 'Failed to add item to cart. Please try again.',
  CART_REMOVE_FAILED: 'Failed to remove item from cart. Please try again.',
  ORDER_FAILED: 'Failed to place order. Please try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  FETCH_FAILED: 'Failed to load data. Please refresh the page.',
} as const;

// HTTP status to error message mapping
const STATUS_ERROR_MAP: Record<number, string> = {
  400: ERROR_MESSAGES.VALIDATION_ERROR,
  401: ERROR_MESSAGES.UNAUTHORIZED,
  403: ERROR_MESSAGES.FORBIDDEN,
  404: ERROR_MESSAGES.NOT_FOUND,
  408: ERROR_MESSAGES.TIMEOUT,
  500: ERROR_MESSAGES.SERVER_ERROR,
  502: ERROR_MESSAGES.SERVER_ERROR,
  503: ERROR_MESSAGES.SERVER_ERROR,
};

// Parse error from API response
export async function parseApiError(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      // Handle different error response formats
      if (data.error) {
        return typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
      }
      if (data.message) {
        return data.message;
      }
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map((e: { message?: string }) => e.message || e).join(', ');
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  return STATUS_ERROR_MAP[response.status] || ERROR_MESSAGES.SERVER_ERROR;
}

// Fetch wrapper with built-in error handling
export async function fetchApi<T>(
  url: string,
  options?: RequestInit & { 
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
    retries?: number;
    retryDelay?: number;
  }
): Promise<ApiResponse<T>> {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options || {};

  let lastError: string = ERROR_MESSAGES.SERVER_ERROR;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        lastError = await parseApiError(response);
        
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          break;
        }
        
        // Retry on server errors if attempts remaining
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        
        if (showErrorToast) {
          toast.error(lastError);
        }
        
        return { success: false, error: lastError };
      }

      const contentType = response.headers.get('content-type');
      let data: T | undefined;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      }

      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }

      return { success: true, data };
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = ERROR_MESSAGES.TIMEOUT;
        } else if (error.message.includes('fetch')) {
          lastError = ERROR_MESSAGES.NETWORK_ERROR;
        } else {
          lastError = error.message;
        }
      }

      // Retry on network errors
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  if (showErrorToast) {
    toast.error(lastError);
  }

  return { success: false, error: lastError };
}

// Convenience methods
export const api = {
  get: <T>(url: string, options?: Parameters<typeof fetchApi>[1]) => 
    fetchApi<T>(url, { ...options, method: 'GET' }),
    
  post: <T>(url: string, body?: unknown, options?: Parameters<typeof fetchApi>[1]) =>
    fetchApi<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  put: <T>(url: string, body?: unknown, options?: Parameters<typeof fetchApi>[1]) =>
    fetchApi<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  patch: <T>(url: string, body?: unknown, options?: Parameters<typeof fetchApi>[1]) =>
    fetchApi<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    
  delete: <T>(url: string, options?: Parameters<typeof fetchApi>[1]) =>
    fetchApi<T>(url, { ...options, method: 'DELETE' }),
};

// Helper to handle errors in try-catch blocks
export function handleError(error: unknown, showToast = true): string {
  let message: string = ERROR_MESSAGES.SERVER_ERROR;
  
  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      message = ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      message = error.message;
    }
  } else if (typeof error === 'string') {
    message = error;
  }

  if (showToast) {
    toast.error(message);
  }

  console.error('Error:', error);
  return message;
}

// Toast helpers for consistent messaging
export const showToast = {
  success: (message: string) => toast.success(message, { duration: 3000 }),
  error: (message: string) => toast.error(message, { duration: 4000 }),
  loading: (message: string) => toast.loading(message),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
};
