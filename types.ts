export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'blocked';

export interface UserSubscription {
  status: SubscriptionStatus;
  trialEndDate: string; // ISO string
  nextBillingDate: string | null;
  // Computed backend states
  isTrialActive: boolean;
  isSubscriptionActive: boolean;
  isAccessBlocked: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  subscription: UserSubscription;
  createdAt?: string;
}

export type MessageType = 'user' | 'teacher' | 'system';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  audioUrl?: string;
  audioBase64?: string;
  timestamp: Date;
  isAi?: boolean;
  type: MessageType;
}

export interface ChatState {
  messages: Message[];
}

// ADD THESE NEW TYPES FOR BETTER TYPE SAFETY
export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  handle: string;
  avatar_url: string | null;
  subscription_status: SubscriptionStatus;
  trial_end_date: string;
  asaas_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  user_id: string | null;
  type: 'public' | 'private';
  created_at: string;
}

export interface DBMessage {
  id: string;
  chat_id: string;
  sender: string;
  sender_name: string | null;
  content: string;
  is_ai: boolean;
  type: MessageType;
  created_at: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
