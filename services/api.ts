
import { supabase } from './supabase';
import { User, Message } from '../types';

export const api = {
  auth: {
    getCurrentUser: async (): Promise<User | null> => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        if (error) console.error("Error fetching auth user:", error.message);
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn("Profile fetch error (might be first login):", profileError.message);
      }

      const status = profile?.subscription_status || 'trialing';

      return {
        id: user.id,
        email: user.email || '',
        name: profile?.full_name || '', // Mapped from full_name
        handle: profile?.handle || '',
        avatarUrl: profile?.avatar_url || null,
        subscription: {
          status: status,
          trialEndDate: profile?.trial_end_date || null,
          nextBillingDate: null,
          isTrialActive: status === 'trialing',
          isSubscriptionActive: status === 'active' || status === 'trialing',
          isAccessBlocked: status === 'blocked'
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
        .upsert({
          id: userId,
          full_name: data.name, // Mapped to full_name
          handle: data.handle,
          avatar_url: data.avatarUrl,
        });
      if (error) throw error;
    }
  },
  billing: {
    getCheckoutUrl: async (type: 'portal' | 'subscription'): Promise<string> => {
      const { data, error } = await supabase.functions.invoke('asaas-checkout', {
        body: { type }
      });
      if (error) throw error;
      return data.url;
    }
  },
  chat: {
    getHistory: async (channel: 'public' | 'private', userId?: string): Promise<Message[]> => {
      // 1. Get or Create the Chat
      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id')
        .eq('type', channel)
        .eq(channel === 'private' ? 'user_id' : 'type', channel === 'private' ? userId : 'public')
        .maybeSingle();

      if (chatErr) throw chatErr;
      if (!chat) return [];

      // 2. Get Messages for that chat
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(msg => ({
        id: msg.id,
        senderId: msg.sender,
        senderName: msg.sender === 'teacher-driza-ai' ? 'Teacher Driza' : 'Student',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isAi: msg.is_ai,
        type: msg.type
      }));
    },
    sendMessage: async (message: Message, channel: 'public' | 'private', userId?: string) => {
      // 1. Find or create the chat session
      let chatQuery = supabase.from('chats').select('id').eq('type', channel);
      if (channel === 'private') chatQuery = chatQuery.eq('user_id', userId);
      else chatQuery = chatQuery.eq('type', 'public');

      let { data: chat } = await chatQuery.maybeSingle();

      if (!chat) {
        const { data: newChat, error: createErr } = await supabase
          .from('chats')
          .insert({ user_id: userId, type: channel })
          .select()
          .single();
        if (createErr) throw createErr;
        chat = newChat;
      }

      // 2. Send the message
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender: message.senderId,
          content: message.content,
          is_ai: message.isAi || false,
          type: message.type
        });
      if (error) throw error;
    },
    subscribeToMessages: (channel: 'public' | 'private', callback: (message: Message) => void, userId?: string) => {
      const subscription = supabase
        .channel(`messages:${channel}${userId ? ':' + userId : ''}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, async (payload) => {
           const msg = payload.new;
           // Check if this message belongs to the current chat type/user
           const { data: chat } = await supabase.from('chats').select('type, user_id').eq('id', msg.chat_id).single();

           if (chat && chat.type === channel && (channel === 'public' || chat.user_id === userId)) {
              callback({
                id: msg.id,
                senderId: msg.sender,
                senderName: msg.sender === 'teacher-driza-ai' ? 'Teacher Driza' : 'Student',
                content: msg.content,
                timestamp: new Date(msg.created_at),
                isAi: msg.is_ai,
                type: msg.type
              });
           }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }
};
