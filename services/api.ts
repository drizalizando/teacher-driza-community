
import { User, Message, UserSubscription, SubscriptionStatus } from '../types';
import { MOCK_USER, DRIZA_BOT_ID } from '../constants';
import { supabase } from './supabase';

export const api = {
  auth: {
    signIn: async (email: string, password: string): Promise<User | null> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) return null;

      return await api.auth.getUserProfile(data.user);
    },

    signUp: async (email: string, password: string): Promise<User | null> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email: email,
          }
        }
      });
      if (error) throw error;
      if (!data.user) return null;

      return await api.auth.getUserProfile(data.user);
    },

    getCurrentUser: async (): Promise<User | null> => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return null;
      return await api.auth.getUserProfile(user);
    },

    getUserProfile: async (supabaseUser: any): Promise<User> => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      const subscription = await api.billing.syncSubscription(supabaseUser.id);

      if (!profile) {
        return {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: '',
          handle: '',
          subscription
        };
      }

      return {
        id: profile.id,
        email: profile.email || supabaseUser.email || '',
        name: profile.name || '',
        handle: profile.handle || '',
        avatarUrl: profile.avatar_url,
        subscription
      };
    },

    signOut: async (): Promise<void> => {
      await supabase.auth.signOut();
    },

    updateProfile: async (userId: string, data: Partial<User>): Promise<void> => {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: data.name,
          handle: data.handle,
          avatar_url: data.avatarUrl,
          email: data.email,
        });

      if (error) throw error;
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, trial_end_date')
        .eq('id', userId)
        .single();

      const status = (profile?.subscription_status || 'trialing') as SubscriptionStatus;
      const trialEndDate = profile?.trial_end_date || MOCK_USER.subscription.trialEndDate;
      
      return {
        status: status,
        trialEndDate: trialEndDate,
        nextBillingDate: null,
        isTrialActive: status === 'trialing',
        isSubscriptionActive: status === 'active' || status === 'trialing',
        isAccessBlocked: status === 'blocked' || status === 'past_due'
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
      let query = supabase
        .from('messages')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: true });

      if (channel === 'private' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(m => ({
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        content: m.content,
        timestamp: new Date(m.created_at),
        isAi: m.is_ai,
        type: m.type as any
      }));
    },

    sendMessage: async (message: Message, channel: 'public' | 'private', userId?: string): Promise<void> => {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: message.senderId,
          sender_name: message.senderName,
          content: message.content,
          channel: channel,
          user_id: userId || (channel === 'private' ? message.senderId : null),
          is_ai: message.isAi || false,
          type: message.type
        });

      if (error) throw error;
    },

    subscribeToMessages: (channel: 'public' | 'private', onNewMessage: (msg: Message) => void, userId?: string) => {
      const subscription = supabase
        .channel(`${channel}-messages`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel=eq.${channel}`
        }, (payload) => {
          const m = payload.new;
          if (channel === 'private' && m.user_id !== userId) return;

          onNewMessage({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            content: m.content,
            timestamp: new Date(m.created_at),
            isAi: m.is_ai,
            type: m.type as any
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }
};
