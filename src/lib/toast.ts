/**
 * Toast Queue System
 * 
 * Prevents toast stacking and implements proper queue management.
 * Features:
 * - Limits max visible toasts to 3
 * - Queues additional toasts
 * - Supports different toast types (success, error, warning, info)
 * - Deduplication of identical messages
 * - Custom duration per type
 * - Dismiss all functionality
 */

import toast from 'react-hot-toast';

// Configuration
const MAX_VISIBLE_TOASTS = 3;
const TOAST_DURATION = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
  loading: Infinity,
};

// Queue to hold pending toasts
interface QueuedToast {
  message: string;
  type: ToastType;
  options?: ToastOptions;
}

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface ToastOptions {
  duration?: number;
  icon?: string;
  id?: string;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// State
let activeToasts: string[] = [];
const toastQueue: QueuedToast[] = [];
const recentMessages = new Map<string, number>();
const DEDUP_WINDOW = 2000; // 2 seconds deduplication window

/**
 * Clean up expired recent messages for deduplication
 */
const cleanupRecentMessages = () => {
  const now = Date.now();
  recentMessages.forEach((timestamp, message) => {
    if (now - timestamp > DEDUP_WINDOW) {
      recentMessages.delete(message);
    }
  });
};

/**
 * Check if message was recently shown (for deduplication)
 */
const isDuplicate = (message: string): boolean => {
  cleanupRecentMessages();
  return recentMessages.has(message);
};

/**
 * Mark message as recently shown
 */
const markAsShown = (message: string) => {
  recentMessages.set(message, Date.now());
};

/**
 * Process the queue and show next toast if possible
 */
const processQueue = () => {
  // Clean up dismissed toasts from active list
  // Note: react-hot-toast doesn't expose visibility state directly
  // so we rely on our tracking via onClose callbacks

  while (toastQueue.length > 0 && activeToasts.length < MAX_VISIBLE_TOASTS) {
    const nextToast = toastQueue.shift();
    if (nextToast) {
      showToastImmediate(nextToast.message, nextToast.type, nextToast.options);
    }
  }
};

/**
 * Remove toast from active list and process queue
 */
const onToastClose = (toastId: string) => {
  activeToasts = activeToasts.filter(id => id !== toastId);
  setTimeout(processQueue, 100); // Small delay to prevent flickering
};

/**
 * Show toast immediately (internal function)
 */
const showToastImmediate = (
  message: string,
  type: ToastType,
  options?: ToastOptions
): string => {
  const id = options?.id || `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const duration = options?.duration ?? TOAST_DURATION[type];

  const toastOptions = {
    id,
    duration,
    position: options?.position,
  };

  // Style configurations for different types
  const styles = {
    success: {
      style: {
        background: '#10b981',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
    },
    error: {
      style: {
        background: '#ef4444',
        color: '#fff',
        fontWeight: '500',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
    },
    warning: {
      style: {
        background: '#f59e0b',
        color: '#fff',
        fontWeight: '500',
      },
      icon: '⚠️',
    },
    info: {
      style: {
        background: '#3b82f6',
        color: '#fff',
        fontWeight: '500',
      },
      icon: 'ℹ️',
    },
    loading: {
      style: {
        background: '#6b7280',
        color: '#fff',
        fontWeight: '500',
      },
    },
  };

  let toastId: string;

  switch (type) {
    case 'success':
      toastId = toast.success(message, { ...toastOptions, ...styles.success });
      break;
    case 'error':
      toastId = toast.error(message, { ...toastOptions, ...styles.error });
      break;
    case 'warning':
      toastId = toast(message, { ...toastOptions, ...styles.warning });
      break;
    case 'info':
      toastId = toast(message, { ...toastOptions, ...styles.info });
      break;
    case 'loading':
      toastId = toast.loading(message, { ...toastOptions, ...styles.loading });
      break;
    default:
      toastId = toast(message, toastOptions);
  }

  activeToasts.push(toastId);
  markAsShown(message);

  // Schedule removal from active list
  if (duration !== Infinity) {
    setTimeout(() => onToastClose(toastId), duration + 500);
  }

  return toastId;
};

/**
 * Show a toast with queue management
 */
const showToast = (
  message: string,
  type: ToastType,
  options?: ToastOptions
): string | null => {
  // Skip duplicate messages within deduplication window
  if (isDuplicate(message) && !options?.id) {
    return null;
  }

  // If we have room, show immediately
  if (activeToasts.length < MAX_VISIBLE_TOASTS) {
    return showToastImmediate(message, type, options);
  }

  // Otherwise, queue it
  toastQueue.push({ message, type, options });
  return null;
};

// Public API
export const toastQueue$ = {
  /**
   * Show a success toast
   */
  success: (message: string, options?: ToastOptions): string | null => {
    return showToast(message, 'success', options);
  },

  /**
   * Show an error toast
   */
  error: (message: string, options?: ToastOptions): string | null => {
    return showToast(message, 'error', options);
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, options?: ToastOptions): string | null => {
    return showToast(message, 'warning', options);
  },

  /**
   * Show an info toast
   */
  info: (message: string, options?: ToastOptions): string | null => {
    return showToast(message, 'info', options);
  },

  /**
   * Show a loading toast (must be manually dismissed)
   */
  loading: (message: string, options?: ToastOptions): string | null => {
    return showToast(message, 'loading', options);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
    onToastClose(toastId);
  },

  /**
   * Dismiss all toasts and clear queue
   */
  dismissAll: () => {
    toast.dismiss();
    activeToasts = [];
    toastQueue.length = 0;
    recentMessages.clear();
  },

  /**
   * Update an existing toast (useful for loading -> success/error transitions)
   */
  update: (toastId: string, message: string, type: ToastType) => {
    toast.dismiss(toastId);
    onToastClose(toastId);
    return showToast(message, type, { id: toastId });
  },

  /**
   * Promise-based toast for async operations
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ): Promise<T> => {
    return toast.promise(promise, messages);
  },

  /**
   * Get the current queue length
   */
  getQueueLength: (): number => toastQueue.length,

  /**
   * Get the number of active toasts
   */
  getActiveCount: (): number => activeToasts.length,
};

// Export individual functions for convenience
export const {
  success: toastSuccess,
  error: toastError,
  warning: toastWarning,
  info: toastInfo,
  loading: toastLoading,
  dismiss: toastDismiss,
  dismissAll: toastDismissAll,
  update: toastUpdate,
  promise: toastPromise,
} = toastQueue$;

// Default export
export default toastQueue$;
