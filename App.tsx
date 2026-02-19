
import React, { useState, useEffect } from 'react';
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
    // Immersion default messages
    setPublicMessages([
      {
        id: 'welcome-1',
        senderId: 'system',
        senderName: 'System',
        content: 'Welcome to the English Practice Hub! Remember: Try to use English always.',
        timestamp: new Date(),
        type: 'system'
      },
      {
        id: 'driza-daily',
        senderId: DRIZA_BOT_ID,
        senderName: 'Teacher Driza',
        content: "Morning everyone! 👋 Ready for today's challenge? Post one sentence about your lunch in English!",
        timestamp: new Date(),
        isAi: true,
        type: 'teacher'
      }
    ]);

    setPrivateMessages([
      {
        id: 'priv-1',
        senderId: DRIZA_BOT_ID,
        senderName: 'Teacher Driza',
        content: "Hi there! I'm your private mentor. Feel free to send me any questions or voice messages in English. I'm here to help you shine!",
        timestamp: new Date(),
        isAi: true,
        type: 'teacher'
      }
    ]);

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
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { api.auth.signOut(); setStep('landing'); }} />
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
                {activeTab === 'public' && <ChatWindow title="Community Feed" subtitle="Public Practice" messages={publicMessages} onSendMessage={(txt) => setPublicMessages(p => [...p, { id: Date.now().toString(), senderId: user.id, senderName: user.name, content: txt, timestamp: new Date(), type: 'user' }])} user={user} isAiTyping={isAiTyping} />}
                {activeTab === 'private' && <ChatWindow title="My Teacher" subtitle="Private Guidance" messages={privateMessages} onSendMessage={(txt) => setPrivateMessages(p => [...p, { id: Date.now().toString(), senderId: user.id, senderName: user.name, content: txt, timestamp: new Date(), type: 'user' }])} user={user} isAiTyping={isAiTyping} showMic={true} />}
                {activeTab === 'billing' && <Billing user={user} />}
                {activeTab === 'settings' && <div className="flex-1 flex items-center justify-center py-10">
                  <div className="max-w-md w-full p-10 bg-white rounded-[2.5rem] border border-pearl-200 shadow-soft text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-pearl-50 overflow-hidden border-2 border-coral-50 shadow-inner flex items-center justify-center">
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <Icons.Users />}
                    </div>
                    <h2 className="text-xl font-black text-gray-900">{user.name}</h2>
                    <p className="text-xs font-black text-coral-500 uppercase tracking-widest">{user.handle}</p>
                    <button onClick={() => { api.auth.signOut(); setStep('landing'); }} className="mt-8 w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-50 rounded-2xl">Sign Out</button>
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
