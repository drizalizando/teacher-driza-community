
import React, { useState, useEffect } from 'react';
import { User, Message, MessageType } from './types';
import { DRIZA_BOT_ID, MOCK_USER, Icons } from './constants';
import { getDrizaResponse, transcribeAudio, textToSpeech } from './services/geminiService';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import TrialBanner from './components/TrialBanner';
import Auth from './pages/Auth';
import Billing from './pages/Billing';

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('public');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const [publicMessages, setPublicMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      senderId: 'system',
      senderName: 'System',
      content: 'Welcome to Teacher Driza Community! Feel free to interact in English or ask questions if you need help.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      type: 'system'
    },
    {
      id: 'driza-daily',
      senderId: DRIZA_BOT_ID,
      senderName: 'Teacher Driza',
      content: "Hello everyone! Welcome to our space. \n\nToday's Topic: Daily Routines ☀️ \nDynamic: Tell us one thing you do every morning in English!\nDesafio: Use a palavra 'lately' na sua frase.",
      timestamp: new Date(Date.now() - 1000 * 60 * 50),
      isAi: true,
      type: 'teacher'
    }
  ]);

  const [privateMessages, setPrivateMessages] = useState<Message[]>([
    {
      id: 'priv-1',
      senderId: DRIZA_BOT_ID,
      senderName: 'Teacher Driza',
      content: "Olá! Sou sua mentora particular. Posso te ajudar com seu inglês ou tirar dúvidas sobre o idioma. Você também pode me mandar áudios clicando no microfone! Como posso te ajudar hoje?",
      timestamp: new Date(),
      isAi: true,
      type: 'teacher'
    }
  ]);

  useEffect(() => {
    const initApp = async () => {
      const currentUser = await api.auth.getCurrentUser();
      if (currentUser) {
        // Prepare subscription states for access control
        const subStatus = await api.billing.syncSubscription(currentUser.id);
        setUser({ ...currentUser, subscription: subStatus });
      }
    };
    initApp();
  }, []);

  // Realtime Integration Simulation
  useEffect(() => {
    if (!user) return;
    const unsub = api.chat.subscribeToMessages('public', (msg) => {
      setPublicMessages(prev => [...prev, msg]);
    });
    return () => unsub();
  }, [user]);

  const handleLogin = (u: any) => {
    // Format according to new User interface with backend flags
    const formattedUser: User = {
      ...u,
      handle: u.handle || `@${u.name.toLowerCase().replace(/\s/g, '')}`,
      subscription: {
        ...u.subscription,
        isTrialActive: u.subscription.status === 'trialing',
        isSubscriptionActive: u.subscription.status === 'active',
        isAccessBlocked: u.subscription.status === 'blocked' || u.subscription.status === 'past_due'
      }
    };
    setUser(formattedUser);
    localStorage.setItem('teacher_driza_user', JSON.stringify(formattedUser));
  };

  const handleLogout = async () => {
    await api.auth.signOut();
    setUser(null);
  };

  const isAccessBlocked = user?.subscription.isAccessBlocked;

  const sendPublicMessage = async (text: string) => {
    if (!user || isAccessBlocked) return;
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: text,
      timestamp: new Date(),
      type: 'user'
    };
    setPublicMessages(prev => [...prev, newUserMsg]);
    await api.chat.sendMessage(newUserMsg);

    const lowerText = text.toLowerCase();
    const isMentioned = lowerText.includes('@teacherdriza');
    if (isMentioned) {
      setIsAiTyping(true);
      const response = await getDrizaResponse(text, false, publicMessages);
      setIsAiTyping(false);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: DRIZA_BOT_ID,
        senderName: 'Teacher Driza',
        content: response.text,
        timestamp: new Date(),
        isAi: true,
        type: 'teacher'
      };
      setPublicMessages(prev => [...prev, botMsg]);
      await api.chat.sendMessage(botMsg);
    }
  };

  const sendPrivateMessage = async (text: string) => {
    if (!user || isAccessBlocked) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: text,
      timestamp: new Date(),
      type: 'user'
    };
    setPrivateMessages(prev => [...prev, newUserMsg]);
    await api.chat.sendMessage(newUserMsg);

    setIsAiTyping(true);
    const response = await getDrizaResponse(text, true, privateMessages);
    setIsAiTyping(false);
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      senderId: DRIZA_BOT_ID,
      senderName: 'Teacher Driza',
      content: response.text,
      timestamp: new Date(),
      isAi: true,
      type: 'teacher'
    };
    setPrivateMessages(prev => [...prev, botMsg]);
    await api.chat.sendMessage(botMsg);
  };

  const sendPrivateAudio = async (blob: Blob, base64: string) => {
    if (!user || isAccessBlocked) return;

    const userAudioUrl = URL.createObjectURL(blob);
    const newUserMsg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content: "Mensagem de áudio enviada 🎙️",
      audioUrl: userAudioUrl,
      timestamp: new Date(),
      type: 'user'
    };
    setPrivateMessages(prev => [...prev, newUserMsg]);

    setIsAiTyping(true);

    try {
      const transcribedText = await transcribeAudio(base64);
      const inputForAi = transcribedText || "O aluno enviou um áudio que não pôde ser transcrito, mas quer praticar.";
      const drizaResponse = await getDrizaResponse(inputForAi, true, privateMessages);
      const aiAudioBase64 = await textToSpeech(drizaResponse.text);

      let aiAudioUrl = undefined;
      if (aiAudioBase64) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioData = decodeBase64(aiAudioBase64);
        const audioBuffer = await decodeAudioData(audioData, audioCtx, 24000, 1);
        const wavBlob = bufferToWav(audioBuffer);
        aiAudioUrl = URL.createObjectURL(wavBlob);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start(0);
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: DRIZA_BOT_ID,
        senderName: 'Teacher Driza',
        content: drizaResponse.text,
        audioUrl: aiAudioUrl,
        timestamp: new Date(),
        isAi: true,
        type: 'teacher'
      };
      setPrivateMessages(prev => [...prev, botMsg]);
      await api.chat.sendMessage(botMsg);

    } catch (error) {
      console.error("Audio Pipeline Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        senderId: DRIZA_BOT_ID,
        senderName: 'Teacher Driza',
        content: "Desculpe, tive um probleminha técnico para processar seu áudio. Pode tentar de novo ou me mandar um texto?",
        timestamp: new Date(),
        isAi: true,
        type: 'teacher'
      };
      setPrivateMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  function bufferToWav(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    let offset = 0, pos = 0;
    const setUint32 = (d: number) => { view.setUint32(pos, d, true); pos += 4; };
    const setUint16 = (d: number) => { view.setUint16(pos, d, true); pos += 2; };
    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157);
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164);
    setUint32(length - pos - 4);
    const channels = [];
    for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let s = Math.max(-1, Math.min(1, channels[i][offset]));
        view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([bufferArray], { type: 'audio/wav' });
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-pearl-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col h-full min-h-0 relative overflow-hidden">
        <TrialBanner user={user} />
        <div className="flex-1 flex flex-col min-h-0 p-0 md:p-3 lg:p-4 max-w-[1400px] mx-auto w-full transition-all duration-500 overflow-hidden">
          {isAccessBlocked ? (
             <div className="flex-1 flex items-center justify-center p-6">
               <div className="max-w-md w-full bg-white p-8 rounded-[2rem] border border-red-100 shadow-2xl shadow-red-500/5 text-center">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icons.CreditCard />
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 mb-2">Access Suspended</h2>
                 <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                   Seu período de teste expirou ou houve um problema com seu pagamento. Regularize sua assinatura para voltar a falar com a Teacher Driza.
                 </p>
                 <button 
                  onClick={() => setActiveTab('billing')}
                  className="w-full py-4 bg-coral-500 text-white font-black rounded-2xl shadow-xl shadow-coral-500/20"
                 >
                   Verificar Assinatura
                 </button>
               </div>
             </div>
          ) : (
            <>
              {activeTab === 'public' && (
                <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ChatWindow 
                    title="Community Chat"
                    subtitle="Aprenda junto com outros alunos"
                    messages={publicMessages}
                    onSendMessage={sendPublicMessage}
                    user={user}
                    isAiTyping={isAiTyping}
                  />
                </div>
              )}
              {activeTab === 'private' && (
                <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ChatWindow 
                    title="Teacher Driza (Mentora)"
                    subtitle="Sua prática particular de áudio e texto"
                    messages={privateMessages}
                    onSendMessage={sendPrivateMessage}
                    onSendAudio={sendPrivateAudio}
                    user={user}
                    isAiTyping={isAiTyping}
                    showMic={true}
                  />
                </div>
              )}
              {activeTab === 'billing' && (
                <div className="flex-1 overflow-y-auto px-4">
                  <Billing user={user} />
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="flex-1 overflow-y-auto flex items-center justify-center p-4">
                  <div className="max-w-xl w-full py-10 px-8 bg-white rounded-[2rem] border border-pearl-200 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 mb-8">
                       <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Account Settings</h2>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center gap-4">
                         <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-3xl bg-pearl-100 border-2 border-dashed border-pearl-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-coral-300">
                               {user.avatarUrl ? (
                                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                               ) : (
                                  <div className="text-pearl-300 group-hover:text-coral-300 transition-colors">
                                     <Icons.Camera />
                                  </div>
                               )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-coral-500 text-white p-2 rounded-xl shadow-lg shadow-coral-500/20 group-hover:scale-110 transition-transform">
                               <Icons.Camera />
                            </div>
                         </div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add a profile picture</p>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Como você quer ser chamado?</label>
                          <input 
                            type="text" 
                            defaultValue={user.name} 
                            placeholder="Seu nome ou apelido"
                            className="w-full p-4 bg-pearl-50 border border-pearl-200 rounded-2xl outline-none focus:border-coral-500 focus:ring-4 focus:ring-coral-500/5 transition-all text-sm font-bold text-gray-900" 
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">@ Handle</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">@</span>
                            <input 
                              type="text" 
                              defaultValue={user.handle.replace('@', '')} 
                              placeholder="username"
                              className="w-full pl-10 pr-4 py-4 bg-pearl-50 border border-pearl-200 rounded-2xl outline-none focus:border-coral-500 focus:ring-4 focus:ring-coral-500/5 transition-all text-sm font-bold text-gray-900" 
                            />
                          </div>
                          <p className="mt-2 text-[9px] text-gray-400 font-medium px-1">Este é o nome que outros alunos verão na comunidade.</p>
                        </div>

                        <button className="w-full py-5 bg-coral-500 text-white font-black rounded-2xl shadow-xl shadow-coral-500/20 hover:bg-coral-600 active:scale-[0.98] transition-all uppercase tracking-widest text-xs mt-4">
                          Update Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="md:hidden bg-white/80 backdrop-blur-xl border-t border-pearl-200 p-2 flex justify-around items-center sticky bottom-0 z-50">
           <button onClick={() => setActiveTab('public')} className={`p-3 rounded-2xl ${activeTab === 'public' ? 'text-coral-600 bg-coral-50' : 'text-gray-400'}`}>
              <span className="flex flex-col items-center text-[9px] font-black uppercase tracking-widest"><Icons.Users />Público</span>
           </button>
           <button onClick={() => setActiveTab('private')} className={`p-3 rounded-2xl ${activeTab === 'private' ? 'text-coral-600 bg-coral-50' : 'text-gray-400'}`}>
              <span className="flex flex-col items-center text-[9px] font-black uppercase tracking-widest"><Icons.MessageSquare />Mentoria</span>
           </button>
           <button onClick={() => setActiveTab('billing')} className={`p-3 rounded-2xl ${activeTab === 'billing' ? 'text-coral-600 bg-coral-50' : 'text-gray-400'}`}>
              <span className="flex flex-col items-center text-[9px] font-black uppercase tracking-widest"><Icons.CreditCard />Plano</span>
           </button>
        </div>
      </main>
    </div>
  );
};

export default App;
