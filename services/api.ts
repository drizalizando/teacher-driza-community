
import { supabase } from './supabase';
import { User, Message } from '../types';

export const api = {
  auth: {
    getCurrentUser: async (): Promise<User | null> => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || '',
        handle: profile?.handle || '',
        avatarUrl: profile?.avatar_url || null,
        subscription: {
          status: profile?.subscription_status || 'trialing',
          trialEndDate: profile?.trial_end_date || null,
          nextBillingDate: null,
          isTrialActive: true,
          isSubscriptionActive: true,
          isAccessBlocked: profile?.subscription_status === 'blocked'
        }
      };
    },
    signIn: async (email: string, password: string): Promise<User | null> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return api.auth.getCurrentUser();
    },
    signUp: async (email: string, password: string): Promise<User | null> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) return null;
      return api.auth.getCurrentUser();
    },
    signOut: async (): Promise<void> => {
      await supabase.auth.signOut();
    },
    updateProfile: async (id: string, data: Partial<User>): Promise<void> => {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          handle: data.handle,
          avatar_url: data.avatarUrl,
        })
        .eq('id', id);
      if (error) throw error;
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
        senderId: m.sender_id || 'teacher-driza-ai',
        senderName: m.sender_name,
        content: m.content,
        timestamp: new Date(m.created_at),
        isAi: m.is_ai,
        type: m.type as any
      }));
    },
    sendMessage: async (message: Message, channel: 'public' | 'private', userId?: string): Promise<void> => {
      const isAi = message.senderId === 'teacher-driza-ai';
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: isAi ? null : message.senderId,
          user_id: userId || message.senderId,
          sender_name: message.senderName,
          content: message.content,
          channel: channel,
          is_ai: message.isAi || false,
          type: message.type
        });
      if (error) throw error;
    },
    subscribeToMessages: (channel: 'public' | 'private', callback: (msg: Message) => void, userId?: string) => {
      const channelId = `${channel}-messages-${userId || 'all'}`;
      const subscription = supabase
        .channel(channelId)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        }, (payload) => {
          const m = payload.new;
          if (m.channel === channel && (channel === 'public' || m.user_id === userId)) {
            callback({
              id: m.id,
              senderId: m.sender_id || 'teacher-driza-ai',
              senderName: m.sender_name,
              content: m.content,
              timestamp: new Date(m.created_at),
              isAi: m.is_ai,
              type: m.type as any
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  },
  billing: {
    getCheckoutUrl: async (type: string): Promise<string> => {
      // Logic to get Asaas checkout or portal URL
      // Normally this calls a Supabase Edge Function
      return "https://sandbox.asaas.com/checkout";
    }
  }
};
