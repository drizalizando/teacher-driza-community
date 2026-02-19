
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
  avatarUrl?: string;
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
  type: MessageType; // Prepared for DB categorization
}

export interface ChatState {
  messages: Message[];
}
