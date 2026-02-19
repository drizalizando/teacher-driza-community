
import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { Icons, DRIZA_BOT_ID } from '../constants';

const MessageAudioPlayer: React.FC<{ url: string; isOwn: boolean }> = ({ url, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setIsPlaying(false);
    return () => audio.pause();
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`mt-2 flex items-center gap-3 p-3 rounded-2xl border ${
      isOwn ? 'bg-coral-600/10 border-coral-400/20' : 'bg-pearl-50 border-pearl-200'
    }`}>
      <button 
        onClick={togglePlay} 
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isOwn ? 'bg-white text-coral-600 shadow-sm' : 'bg-coral-500 text-white shadow-md'}`}
      >
        {isPlaying ? <div className="w-2.5 h-2.5 bg-current rounded-sm"></div> : <Icons.Volume />}
      </button>
      <div className="flex-1 h-1 bg-black/5 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-300 ${isOwn ? 'bg-white' : 'bg-coral-500'}`} style={{ width: '40%' }}></div>
      </div>
    </div>
  );
};

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  user: User;
  title: string;
  subtitle: string;
  isAiTyping?: boolean;
  showMic?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, user, title, subtitle, isAiTyping, showMic = false }) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isAiTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-white sm:rounded-[2.5rem] shadow-soft lg:border border-pearl-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-8 sm:py-5 border-b border-pearl-100 bg-white/95 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-coral-50 text-coral-500 rounded-xl sm:rounded-2xl flex items-center justify-center">
            <Icons.Users />
          </div>
          <div>
            <h2 className="text-sm sm:text-lg font-black text-gray-950 tracking-tight leading-none mb-1">{title}</h2>
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 rounded-full border border-green-100">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Message Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-5 sm:space-y-8 bg-pearl-50/10 overscroll-contain pb-24 lg:pb-8">
        {messages.map((msg) => {
          const isOwn = msg.senderId === user.id;
          const isAi = msg.senderId === DRIZA_BOT_ID;
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] sm:max-w-[75%] flex gap-2.5 sm:gap-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl shrink-0 overflow-hidden shadow-sm flex items-center justify-center font-black text-[9px] sm:text-[10px] ${isAi ? 'bg-coral-500 text-white' : isOwn ? 'bg-white border border-pearl-200' : 'bg-pearl-100 text-gray-600'}`}>
                  {isAi ? 'TD' : isOwn ? (user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.name.charAt(0)) : msg.senderName.charAt(0)}
                </div>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <span className="text-[7px] sm:text-[9px] text-gray-400 mb-1 font-black uppercase tracking-widest px-1">
                    {isAi ? 'Teacher Driza' : msg.senderName} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={`px-4 py-3 sm:px-6 sm:py-4 rounded-2xl sm:rounded-[1.8rem] text-[14px] sm:text-[16px] font-bold leading-relaxed shadow-sm ${
                    isOwn ? 'bg-coral-500 text-white rounded-tr-none' : 'bg-white text-gray-950 border border-pearl-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                    {msg.audioUrl && <MessageAudioPlayer url={msg.audioUrl} isOwn={isOwn} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {isAiTyping && (
          <div className="flex justify-start animate-in fade-in">
             <div className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-coral-500 text-white flex items-center justify-center text-[9px] font-black shadow-sm">TD</div>
                <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 rounded-2xl sm:rounded-[1.8rem] rounded-tl-none border border-pearl-100 flex items-center gap-2 shadow-sm">
                   <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-coral-200 rounded-full animate-bounce"></div>
                   <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-coral-300 rounded-full animate-bounce [animation-delay:-0.1s]"></div>
                   <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-coral-400 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 sm:p-6 bg-white border-t border-pearl-100 shrink-0 sticky bottom-0 z-30 mb-safe">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2 sm:gap-3 items-end">
          {showMic && (
            <button type="button" className="w-11 h-11 sm:w-14 sm:h-14 bg-pearl-50 text-gray-400 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-coral-50 hover:text-coral-500 transition-all border border-pearl-100 active:scale-90 shrink-0">
              <Icons.Mic />
            </button>
          )}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message..."
              className="w-full pl-4 pr-12 py-3 sm:py-4 bg-pearl-50 border-2 border-pearl-100 focus:border-coral-500 focus:bg-white rounded-xl sm:rounded-[1.8rem] outline-none text-gray-900 font-bold transition-all placeholder:text-gray-300 shadow-sm text-sm sm:text-base"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()} 
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 bg-coral-500 text-white rounded-lg sm:rounded-xl shadow-lg flex items-center justify-center active:scale-90 disabled:opacity-20 transition-all"
            >
              <Icons.Send />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
