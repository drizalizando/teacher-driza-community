
import React, { useState, useEffect, useCallback } from 'react';
import { User, Message } from './types';
import { DRIZA_BOT_ID, MOCK_USER, Icons } from './constants';
import { getDrizaResponse, transcribeAudio, textToSpeech } from './services/geminiService';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import ChatWindow from './components/ChatWindow';
import TrialBanner from './components/TrialBanner';
import Auth from './pages/Auth';
import Billing from './pages/Billing';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import PaymentBridge from './pages/PaymentBridge';
import AppTour from './components/AppTour';

type AppStep = 'landing' | 'auth' | 'payment' | 'onboarding' | 'dashboard';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('public');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showTour, setShowTour] = useState(false);
  
  const [publicMessages, setPublicMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);

  useEffect(() => {
    const initApp = async () => {
      const currentUser = await api.auth.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        if (!currentUser.name || !currentUser.handle) setStep('onboarding');
        else setStep('dashboard');
      }
    };
    initApp();
  }, []);

  // Fetch history and subscribe when in dashboard
  useEffect(() => {
    if (step !== 'dashboard' || !user) return;

    // Public messages
    api.chat.getHistory('public').then(setPublicMessages);
    const unsubPublic = api.chat.subscribeToMessages('public', (msg) => {
      setPublicMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Private messages
    api.chat.getHistory('private', user.id).then(setPrivateMessages);
    const unsubPrivate = api.chat.subscribeToMessages('private', (msg) => {
      setPrivateMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }, user.id);

    return () => {
      unsubPublic();
      unsubPrivate();
    };
  }, [step, user?.id]);

  const handleSendMessage = async (text: string, channel: 'public' | 'private') => {
    if (!user) return;

    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      content: text,
      timestamp: new Date(),
      type: 'user'
    };

    // Optimistically update local state if real-time is slow
    // But since we have real-time, we'll just send to DB and let listener handle it
    await api.chat.sendMessage(newMessage, channel, user.id);

    // AI Trigger Logic
    const shouldTriggerAi = channel === 'private' || text.toLowerCase().includes('@teacherdriza');

    if (shouldTriggerAi) {
      setIsAiTyping(true);
      try {
        const history = channel === 'private' ? privateMessages : publicMessages;
        const response = await getDrizaResponse(text, channel === 'private', history);

        const aiMessage: Message = {
          id: `temp-ai-${Date.now()}`,
          senderId: DRIZA_BOT_ID,
          senderName: 'Teacher Driza',
          content: response.text,
          timestamp: new Date(),
          isAi: true,
          type: 'teacher'
        };

        await api.chat.sendMessage(aiMessage, channel, user.id);
      } catch (error) {
        console.error("AI Response error:", error);
      } finally {
        setIsAiTyping(false);
      }
    }
  };

  const handleOnboardingComplete = async (profileData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...profileData };
    await api.auth.updateProfile(user.id, updatedUser);
    setUser(updatedUser);
    setStep('dashboard');
    setTimeout(() => setShowTour(true), 800);
  };

  const isAccessBlocked = user?.subscription.isAccessBlocked;

  // Renderers
  if (step === 'landing') return <Landing onGetStarted={() => setStep('auth')} onLogin={() => setStep('auth')} />;
  if (step === 'auth' && !user) return <Auth onLogin={(u) => { setUser(u); setStep(u.name ? 'dashboard' : 'onboarding'); }} onSignup={() => setStep('payment')} />;
  if (step === 'payment') return <PaymentBridge onPaymentConfirmed={() => setStep('onboarding')} />;
  if (step === 'onboarding' && user) return <Onboarding user={user} onComplete={handleOnboardingComplete} />;

  if (step === 'dashboard' && user) {
    return (
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-pearl-50">
        {showTour && <AppTour onComplete={() => setShowTour(false)} />}
        
        {/* Responsive Navigation */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={async () => { await api.auth.signOut(); setStep('landing'); }} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden pb-16 lg:pb-0">
          <TrialBanner user={user} />
          
          <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 lg:p-6 max-w-[1200px] mx-auto w-full transition-all duration-500 overflow-y-auto">
            {isAccessBlocked ? (
               <div className="flex-1 flex items-center justify-center p-6 text-center">
                 <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-premium">
                    <h2 className="text-2xl font-black mb-4">Account Blocked</h2>
                    <p className="text-gray-500 mb-8">Please check your payment status in the subscription tab.</p>
                    <button onClick={() => setActiveTab('billing')} className="w-full py-4 bg-coral-500 text-white font-black rounded-2xl">Manage Billing</button>
                 </div>
               </div>
            ) : (
              <>
                {activeTab === 'public' && <ChatWindow title="Community Feed" subtitle="Public Practice" messages={publicMessages} onSendMessage={(txt) => handleSendMessage(txt, 'public')} user={user} isAiTyping={isAiTyping} />}
                {activeTab === 'private' && <ChatWindow title="My Teacher" subtitle="Private Guidance" messages={privateMessages} onSendMessage={(txt) => handleSendMessage(txt, 'private')} user={user} isAiTyping={isAiTyping} showMic={true} />}
                {activeTab === 'billing' && <Billing user={user} />}
                {activeTab === 'settings' && <div className="flex-1 flex items-center justify-center py-10">
                  <div className="max-w-md w-full p-10 bg-white rounded-[2.5rem] border border-pearl-200 shadow-soft text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-pearl-50 overflow-hidden border-2 border-coral-50 shadow-inner flex items-center justify-center">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <Icons.Users />}
                    </div>
                    <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
                    <p className="text-xs font-black text-coral-500 uppercase tracking-widest">{user.handle}</p>
                    <button onClick={async () => { await api.auth.signOut(); setStep('landing'); }} className="mt-8 w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-50 rounded-2xl">Sign Out</button>
                  </div>
                </div>}
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
};

export default App;
