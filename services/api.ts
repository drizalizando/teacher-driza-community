
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
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError.message);
      }

      const status = profile?.subscription_status || 'trialing';

      return {
        id: user.id,
        email: user.email || '',
        name: profile?.full_name || '', // Map full_name from DB to 'name' in frontend
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
      console.log("Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error("Sign in error:", error.message);
        throw error;
      }
      if (!data.user) return null;

      const user = await api.auth.getCurrentUser();
      if (!user) {
        // Fallback if trigger hasn't finished
        return {
          id: data.user.id,
          email: data.user.email || '',
          name: '',
          handle: '',
          subscription: { status: 'trialing', trialEndDate: '', nextBillingDate: null, isTrialActive: true, isSubscriptionActive: true, isAccessBlocked: false }
        };
      }
      return user;
    },
    signUp: async (email: string, password: string): Promise<User | null> => {
      console.log("Attempting sign up for:", email);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error("Sign up error:", error.message);
        throw error;
      }
      if (!data.user) return null;

      const user = await api.auth.getCurrentUser();
      if (!user) {
        return {
          id: data.user.id,
          email: data.user.email || '',
          name: '',
          handle: '',
          subscription: { status: 'trialing', trialEndDate: '', nextBillingDate: null, isTrialActive: true, isSubscriptionActive: true, isAccessBlocked: false }
        };
      }
      return user;
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
    updateProfile: async (userId: string, data: Partial<User>) => {
      console.log("Updating profile for:", userId, data);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: data.name, // Map name from frontend to 'full_name' in DB
          handle: data.handle,
          avatar_url: data.avatarUrl,
          updated_at: new Date().toISOString()
        });
      if (error) {
        console.error("Profile update error:", error.message);
        throw error;
      }
      console.log("Profile updated successfully");
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
        senderName: msg.sender_name || (msg.sender === 'teacher-driza-ai' ? 'Teacher Driza' : 'Student'),
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
          sender_name: message.senderName,
          content: message.content,
          is_ai: message.isAi || false,
          type: message.type
        });
      if (error) throw error;
    },
    subscribeToMessages: (channel: 'public' | 'private', callback: (message: Message) => void, userId?: string) => {
      // Create a unique channel name to avoid conflicts
      const channelName = `messages:${channel}:${userId || 'public'}`;

      const subscription = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, async (payload) => {
           const msg = payload.new;

           // Optimization: Check chat context to verify if message belongs here
           const { data: chat, error } = await supabase
            .from('chats')
            .select('type, user_id')
            .eq('id', msg.chat_id)
            .single();

           if (!error && chat && chat.type === channel) {
             if (channel === 'public' || chat.user_id === userId) {
                callback({
                  id: msg.id,
                  senderId: msg.sender,
                senderName: msg.sender_name || (msg.sender === 'teacher-driza-ai' ? 'Teacher Driza' : 'Student'),
                  content: msg.content,
                  timestamp: new Date(msg.created_at),
                  isAi: msg.is_ai,
                  type: msg.type
                });
             }
           }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${channel} messages`);
          }
        });

      return () => {
        console.log(`Unsubscribing from ${channel} messages`);
        supabase.removeChannel(subscription);
      };
    }
  }
};
