import { toast } from 'sonner';

export interface NativeNotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

export const notify = {
  /** Display a success toast notification */
  success(message: string, description?: string) {
    return toast.success(message, { description });
  },

  /** Display an error toast notification */
  error(message: string, description?: string) {
    return toast.error(message, { description });
  },

  /** Display a warning toast notification */
  warning(message: string, description?: string) {
    return toast.warning(message, { description });
  },

  /** Display an info toast notification */
  info(message: string, description?: string) {
    return toast.info(message, { description });
  },

  /** Display a promise-based loading/success/error toast */
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, messages);
  },

  /** Check if Native OS Notifications are supported */
  isNativeSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /** Get current Native Notification permission status */
  getNativePermission(): NotificationPermission {
    if (!this.isNativeSupported()) return 'denied';
    return Notification.permission;
  },

  /** Request Native OS Notification permission from the browser */
  async requestNativePermission(): Promise<NotificationPermission> {
    if (!this.isNativeSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.success('System Notifications Enabled', 'You will receive OS desktop alerts.');
      } else if (permission === 'denied') {
        this.warning('System Notifications Blocked', 'Allow notifications in browser settings for desktop alerts.');
      }
      return permission;
    } catch (err) {
      console.error('[notify] Native permission request failed:', err);
      return 'denied';
    }
  },

  /** Fire a Native OS System Notification (with automatic fallback to UI toast if native is unavailable) */
  async native(title: string, options?: NativeNotificationOptions) {
    if (this.isNativeSupported() && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body: options?.body,
          icon: options?.icon || '/favicon.ico',
          tag: options?.tag,
        });

        if (options?.onClick) {
          notif.onclick = () => {
            window.focus();
            options.onClick!();
          };
        }
        return notif;
      } catch (err) {
        console.error('[notify] Native notification error:', err);
      }
    }

    // Fallback to UI Toast if Native Notification is denied or unsupported
    return this.info(title, options?.body);
  },
};
