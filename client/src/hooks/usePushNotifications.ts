/**
 * React Hooks for Push Notifications
 * Hooks for managing browser push notifications in React components
 */

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  isPushNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  setupPushNotifications,
} from "@/lib/pushNotifications";
import {
  subscribePushNotification,
  unsubscribePushNotification,
  getPushSubscriptions,
  sendTestNotification,
} from "@/lib/api/pushNotifications";
import type { PushSubscriptionData } from "@/lib/api/pushNotifications";
import type { PushSubscription as APIPushSubscription } from "@/lib/api/pushNotifications";

export interface UsePushNotificationsReturn {
  // State
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscriptions: APIPushSubscription[];
  
  // Actions
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  sendTest: () => Promise<void>;
  
  // Service worker
  registration: ServiceWorkerRegistration | null;
}

/**
 * Main hook for push notification management
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Check if push notifications are supported
  useEffect(() => {
    setIsSupported(isPushNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  // Get push subscriptions
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery({
    queryKey: ["push-subscriptions"],
    queryFn: getPushSubscriptions,
    enabled: isSupported && permission === "granted",
    retry: false,
  });

  // Check subscription status
  useEffect(() => {
    if (subscriptions.length > 0) {
      setIsSubscribed(true);
    } else {
      setIsSubscribed(false);
    }
  }, [subscriptions]);

  // Register service worker on mount (register immediately if supported, not just when permission is granted)
  useEffect(() => {
    if (isSupported) {
      registerServiceWorker()
        .then((reg) => {
          setRegistration(reg);
          // Check if already subscribed
          getCurrentPushSubscription(reg).then((sub) => {
            if (sub) {
              setIsSubscribed(true);
            }
          });
        })
        .catch((err) => {
          console.error("[Push] Service worker registration failed:", err);
          setError(err.message);
        });
    }
  }, [isSupported]);

  // Request permission mutation
  const requestPermissionMutation = useMutation({
    mutationFn: async () => {
      const perm = await requestNotificationPermission();
      setPermission(perm);
      // Service worker should already be registered, but ensure it's ready
      if (perm === "granted" && !registration) {
        const reg = await registerServiceWorker();
        setRegistration(reg);
      }
      return perm;
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration) {
        throw new Error("Service worker not registered");
      }

      // Subscribe to push notifications
      const subscriptionData = await subscribeToPushNotifications(registration);
      
      // Register with server
      await subscribePushNotification(subscriptionData);
      
      // Refresh subscriptions
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      
      setIsSubscribed(true);
      return subscriptionData;
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!registration) {
        throw new Error("Service worker not registered");
      }

      // Get current subscription
      const subscription = await getCurrentPushSubscription(registration);
      
      if (subscription) {
        // Unsubscribe from browser
        await unsubscribeFromPushNotifications(registration);
        
        // Refresh subscriptions
        queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      }
      
      setIsSubscribed(false);
    },
    onError: (err: any) => {
      setError(err.message);
    },
  });

  // Send test notification mutation
  const sendTestMutation = useMutation({
    mutationFn: sendTestNotification,
    onError: (err: any) => {
      setError(err.message);
    },
  });

  const requestPermission = useCallback(async () => {
    setError(null);
    await requestPermissionMutation.mutateAsync();
  }, [requestPermissionMutation]);

  const subscribe = useCallback(async () => {
    setError(null);
    await subscribeMutation.mutateAsync();
  }, [subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    setError(null);
    await unsubscribeMutation.mutateAsync();
  }, [unsubscribeMutation]);

  const sendTest = useCallback(async () => {
    setError(null);
    await sendTestMutation.mutateAsync();
  }, [sendTestMutation]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading: requestPermissionMutation.isPending || subscribeMutation.isPending || unsubscribeMutation.isPending || isLoadingSubscriptions,
    error,
    subscriptions,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTest,
    registration,
  };
}

/**
 * Hook to request push notification permission
 */
export function useRequestPushPermission() {
  const { requestPermission, permission, isSupported } = usePushNotifications();

  return {
    requestPermission,
    permission,
    isSupported,
    isGranted: permission === "granted",
    isDenied: permission === "denied",
    isDefault: permission === "default",
  };
}

/**
 * Hook to manage push subscription state
 */
export function usePushSubscription() {
  const { isSubscribed, subscribe, unsubscribe, isLoading, error } = usePushNotifications();

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    isLoading,
    error,
  };
}

