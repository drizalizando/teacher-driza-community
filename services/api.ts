
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

      const userData: User = {
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

      console.log("getCurrentUser: profile.full_name =", profile?.full_name, "-> user.name =", userData.name);
      console.log("getCurrentUser: user.handle =", userData.handle);

      return userData;
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: '',
            handle: ''
          }
        }
      });
      if (error) {
        console.error("Sign up error:", error.message);
        throw error;
      }
      if (!data.user) return null;

      // Wait for trigger to create profile (small delay for database consistency)
      await new Promise(resolve => setTimeout(resolve, 800));

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
          full_name: data.name || '',
          handle: data.handle || '',
          avatar_url: data.avatarUrl || null,
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
    getHistory: async (channel: 'public' | 'private', userId?: string, limit: number = 100): Promise<Message[]> => {
      // 1. Get or Create the Chat
      const { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id')
        .eq('type', channel)
        .eq(channel === 'private' ? 'user_id' : 'type', channel === 'private' ? userId : 'public')
        .maybeSingle();

      if (chatErr) throw chatErr;
      if (!chat) return [];

      // 2. Get ONLY last 100 messages (pagination)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Reverse to show oldest first
      return (data || []).reverse().map(msg => ({
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
      const channelName = `messages:${channel}:${userId || 'public'}`;

      // First, get the chat_id for filtering
      const getChatId = async () => {
        const { data: chat } = await supabase
          .from('chats')
          .select('id')
          .eq('type', channel)
          .eq(channel === 'private' ? 'user_id' : 'type', channel === 'private' ? userId : 'public')
          .maybeSingle();

        return chat?.id;
      };

      let subscription: any;

      getChatId().then(chatId => {
        if (!chatId) {
          console.warn(`No chat found for ${channel}`);
          return;
        }

        subscription = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chatId}` // CRITICAL: Filter at database level
          }, (payload) => {
            const msg = payload.new;
            callback({
              id: msg.id,
              senderId: msg.sender,
              senderName: msg.sender_name || (msg.sender === 'teacher-driza-ai' ? 'Teacher Driza' : 'Student'),
              content: msg.content,
              timestamp: new Date(msg.created_at),
              isAi: msg.is_ai,
              type: msg.type
            });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Subscribed to ${channel} messages (chat_id: ${chatId})`);
            }
          });
      });

      return () => {
        console.log(`Unsubscribing from ${channel} messages`);
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    }
  }
};
