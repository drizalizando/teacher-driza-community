
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
        level: profile?.level || 'intermediate',
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
          level: 'intermediate',
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
          level: 'intermediate',
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
          level: data.level || 'intermediate',
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
      let { data: chat, error: chatErr } = await supabase
        .from('chats')
        .select('id')
        .eq('type', channel)
        .eq(channel === 'private' ? 'user_id' : 'type', channel === 'private' ? userId : 'public')
        .maybeSingle();

      if (chatErr) throw chatErr;

      // Auto-create private chat if it doesn't exist to facilitate subscriptions
      if (!chat && channel === 'private' && userId) {
        const { data: newChat, error: createErr } = await supabase
          .from('chats')
          .insert({ user_id: userId, type: 'private' })
          .select()
          .single();
        if (!createErr) chat = newChat;
      }

      if (!chat) return [];

      // 2. Get ONLY last 100 messages (pagination)
      const { data, error } = await supabase
        .from('messages')
        .select('id, chat_id, sender, sender_name, content, is_ai, audio_url, type, created_at')
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
        audioUrl: msg.audio_url || undefined,
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
          audio_url: message.audioUrl || null,
          type: message.type
        });

      if (error) {
        console.error("SendMessage Error:", error);
        throw error;
      }
    },
    subscribeToMessages: (channel: 'public' | 'private', callback: (message: Message) => void, userId?: string) => {
      const channelName = `messages:${channel}:${userId || 'public'}`;
      let subscription: any;
      let isUnsubscribed = false;

      // First, get the chat_id for filtering
      const setupSubscription = async () => {
        const { data: chat } = await supabase
          .from('chats')
          .select('id')
          .eq('type', channel)
          .eq(channel === 'private' ? 'user_id' : 'type', channel === 'private' ? userId : 'public')
          .maybeSingle();

        if (!chat?.id) {
          console.warn(`No chat found for ${channel}, cannot subscribe.`);
          return;
        }

        if (isUnsubscribed) return;

        subscription = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${chat.id}`
          }, (payload) => {
            const msg = payload.new;
            callback({
              id: msg.id,
              senderId: msg.sender,
              senderName: msg.sender_name || (msg.sender === 'teacher-driza-ai' ? 'Teacher Driza' : 'Student'),
              content: msg.content,
              audioUrl: msg.audio_url,
              timestamp: new Date(msg.created_at),
              isAi: msg.is_ai,
              type: msg.type
            });
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`Subscribed to ${channel} messages (chat_id: ${chat.id})`);
            }
          });
      };

      setupSubscription();

      return () => {
        isUnsubscribed = true;
        console.log(`Unsubscribing from ${channel} messages`);
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    }
  }
};
