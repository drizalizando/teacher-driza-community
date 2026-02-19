
import { User, Message, UserSubscription, SubscriptionStatus } from '../types';
import { MOCK_USER } from '../constants';

export const api = {
  auth: {
    getCurrentUser: async (): Promise<User | null> => {
      const saved = localStorage.getItem('teacher_driza_user');
      if (saved) {
        const user = JSON.parse(saved);
        // Refresh subscription state
        const sub = await api.billing.syncSubscription(user.id);
        return { ...user, subscription: sub };
      }
      return null;
    },
    signOut: async (): Promise<void> => {
      localStorage.removeItem('teacher_driza_user');
    },
    updateProfile: async (userId: string, data: Partial<User>): Promise<void> => {
      const saved = localStorage.getItem('teacher_driza_user');
      if (saved) {
        const user = JSON.parse(saved);
        const updatedUser = { ...user, ...data };
        localStorage.setItem('teacher_driza_user', JSON.stringify(updatedUser));
      }
    }
  },

  billing: {
    createAsaasSubscription: async (email: string): Promise<{ checkoutUrl: string }> => {
      return { checkoutUrl: 'https://asaas.com/c/checkout-stub' };
    },
    
    checkPaymentStatus: async (userId: string): Promise<boolean> => {
      return true;
    },

    syncSubscription: async (userId: string): Promise<UserSubscription> => {
      const saved = localStorage.getItem('teacher_driza_user');
      const baseStatus = saved ? JSON.parse(saved).subscription.status : MOCK_USER.subscription.status;
      
      return {
        status: baseStatus as SubscriptionStatus,
        trialEndDate: MOCK_USER.subscription.trialEndDate,
        nextBillingDate: null,
        isTrialActive: baseStatus === 'trialing',
        isSubscriptionActive: baseStatus === 'active' || baseStatus === 'trialing',
        isAccessBlocked: baseStatus === 'blocked' || baseStatus === 'past_due'
      };
    },
    getCheckoutUrl: async (planId: string): Promise<string> => {
      return 'https://asaas.com/c/portal-stub';
    },
    cancelSubscription: async (userId: string): Promise<boolean> => {
      return true;
    }
  },

  chat: {
    getHistory: async (channel: 'public' | 'private', userId?: string): Promise<Message[]> => {
      return [];
    },
    sendMessage: async (message: Message): Promise<void> => {
      console.log('Message sync with DB:', message);
    },
    subscribeToMessages: (channel: 'public' | 'private', onNewMessage: (msg: Message) => void) => {
      return () => {};
    }
  }
};
