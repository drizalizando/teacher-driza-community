
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
          isAccessBlocked: false
        }
      };
    },
    signIn: async (email: string, password: string): Promise<User | null> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) return null;
      return api.auth.getCurrentUser();
    },
    signUp: async (email: string, password: string): Promise<User | null> => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.user) return null;
      return api.auth.getCurrentUser();
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    updateProfile: async (userId: string, data: Partial<User>) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          handle: data.handle,
          avatar_url: data.avatarUrl,
        })
        .eq('id', userId);
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

      return (data || []).map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isAi: msg.is_ai,
        type: msg.type
      }));
    },
    sendMessage: async (message: Message, channel: 'public' | 'private', userId?: string) => {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: message.senderId === 'teacher-driza-ai' ? null : message.senderId,
          user_id: userId,
          sender_name: message.senderName,
          content: message.content,
          channel: channel,
          is_ai: message.isAi || false,
          type: message.type
        });
      if (error) throw error;
    },
    subscribeToMessages: (channel: 'public' | 'private', callback: (message: Message) => void, userId?: string) => {
      let filter = `channel=eq.${channel}`;
      if (channel === 'private' && userId) {
        filter += `&user_id=eq.${userId}`;
      }

      const subscription = supabase
        .channel(`messages:${channel}${userId ? ':' + userId : ''}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: filter
        }, payload => {
          const msg = payload.new;
          callback({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            isAi: msg.is_ai,
            type: msg.type
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }
};
