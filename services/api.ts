import { User, Message, UserSubscription, SubscriptionStatus } from '../types';
import { MOCK_USER } from '../constants';

/**
 * SERVICE LAYER: Centralized API calls for Supabase and Asaas.
 * This structure is prepared to be swapped with real Supabase client 
 * and backend endpoints for Asaas payments.
 */

// Use environment variables for future real keys
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const api = {
  // --- AUTHENTICATION (Supabase Auth) ---
  auth: {
    getCurrentUser: async (): Promise<User | null> => {
      // SUPABASE: const { data: { user } } = await supabase.auth.getUser()
      const saved = localStorage.getItem('teacher_driza_user');
      return saved ? JSON.parse(saved) : null;
    },
    signOut: async (): Promise<void> => {
      // SUPABASE: await supabase.auth.signOut()
      localStorage.removeItem('teacher_driza_user');
    }
  },

  // --- BILLING & STATUS (Asaas via Backend) ---
  billing: {
    syncSubscription: async (userId: string): Promise<UserSubscription> => {
      // BACKEND: Consults your API which monitors Asaas Webhooks
      console.log(`Syncing subscription for ${userId}...`);
      
      // Fix: Cast status to SubscriptionStatus to avoid TS inference errors with literal types.
      // MOCK_USER.subscription.status is 'trialing' as const, which causes errors when comparing with 'active' or 'blocked'.
      const status = MOCK_USER.subscription.status as SubscriptionStatus;
      return {
        ...MOCK_USER.subscription,
        isTrialActive: status === 'trialing',
        isSubscriptionActive: status === 'active',
        isAccessBlocked: status === 'blocked' || status === 'past_due'
      } as UserSubscription;
    },
    getCheckoutUrl: async (planId: string): Promise<string> => {
      // BACKEND: Calls Asaas API to generate a payment link
      return 'https://asaas.com/c/placeholder-checkout';
    },
    cancelSubscription: async (userId: string): Promise<boolean> => {
      // BACKEND: Cancels subscription in Asaas
      return true;
    }
  },

  // --- DATABASE & REALTIME (Supabase) ---
  chat: {
    getHistory: async (channel: 'public' | 'private', userId?: string): Promise<Message[]> => {
      // SUPABASE: await supabase.from('messages').select('*').eq('channel', channel)...
      return [];
    },
    sendMessage: async (message: Message): Promise<void> => {
      // SUPABASE: await supabase.from('messages').insert([message])
      console.log('Message stored in Supabase:', message);
    },
    subscribeToMessages: (channel: 'public' | 'private', onNewMessage: (msg: Message) => void) => {
      // SUPABASE REALTIME:
      // supabase.channel(channel).on('postgres_changes', ...).subscribe()
      console.log(`Realtime listener active for: ${channel}`);
      return () => console.log(`Listener detached for: ${channel}`);
    }
  }
};