
import React, { useState, useRef, useEffect } from 'react';
import { Message, User } from '../types';
import { Icons, DRIZA_BOT_ID } from '../constants';

/**
 * Player de Áudio Premium para as bolhas de chat
 */
const MessageAudioPlayer: React.FC<{ url: string; isOwn: boolean }> = ({ url, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    const formatTime = (time: number) => {
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(formatTime(audio.currentTime));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime('0:00');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`mt-3 flex items-center gap-3 p-2.5 rounded-2xl border ${
      isOwn ? 'bg-coral-600/40 border-coral-400/30' : 'bg-pearl-100/80 border-pearl-200'
    }`}>
      <button 
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all transform active:scale-90 ${
          isOwn ? 'bg-white text-coral-600' : 'bg-coral-500 text-white'
        }`}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex justify-between items-center px-1">
           <span className={`text-[9px] font-black uppercase tracking-tighter ${isOwn ? 'text-white/80' : 'text-gray-400'}`}>
             {currentTime}
           </span>
           <Icons.Volume />
        </div>
        <div className="h-1 bg-black/5 rounded-full overflow-hidden relative">
          <div 
            className={`absolute inset-y-0 left-0 transition-all duration-100 ${isOwn ? 'bg-white' : 'bg-coral-500'}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onSendAudio?: (blob: Blob, base64: string) => void;
  user: User;
  title: string;
  subtitle: string;
  isAiTyping?: boolean;
  showMic?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage, 
  onSendAudio,
  user, 
  title, 
  subtitle,
  isAiTyping,
  showMic = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isAiTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          if (onSendAudio) onSendAudio(audioBlob, base64data);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);
      timerRef.current = window.setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Precisamos de acesso ao microfone para praticar conversação!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[1.2rem] md:rounded-[2rem] shadow-2xl shadow-coral-900/5 border border-pearl-200 overflow-hidden backdrop-blur-sm transition-all duration-500">
      {/* Header */}
      <div className="px-5 py-3 md:px-7 md:py-4 border-b border-pearl-100 bg-white/50 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-coral-500 uppercase tracking-[0.2em] mb-0.5">
            Teacher Driza Community
          </span>
          <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tighter leading-none mb-0.5">{title}</h2>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.05em]">{subtitle}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Driza Online</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gradient-to-b from-pearl-50/50 to-white"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#ffc7c3 transparent' }}
      >
        {messages.map((msg) => {
          const isOwn = msg.senderId === user.id;
          const isAi = msg.senderId === DRIZA_BOT_ID;

          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] md:max-w-[75%] flex gap-2 md:gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] md:text-xs font-black shadow-md ${
                  isAi ? 'bg-coral-500 text-white' : isOwn ? 'bg-coral-100 text-coral-800' : 'bg-white border border-pearl-200 text-gray-800'
                }`}>
                  {isAi ? 'TD' : msg.senderName.charAt(0)}
                </div>
                <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <span className="text-[8px] text-gray-400 mb-1 px-1 font-black uppercase tracking-widest">
                    {isAi ? 'Teacher Driza' : msg.senderName} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={`relative px-4 py-3 rounded-[1.2rem] md:rounded-[1.6rem] text-[14px] leading-relaxed shadow-sm font-medium ${
                    isOwn 
                      ? 'bg-coral-500 text-white rounded-tr-none' 
                      : isAi 
                        ? 'bg-white text-gray-900 border border-coral-100 rounded-tl-none' 
                        : 'bg-white text-gray-900 border border-pearl-200 rounded-tl-none'
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
          <div className="flex justify-start animate-in fade-in duration-300">
             <div className="flex gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-coral-500 text-white flex items-center justify-center text-[10px] font-black shadow-md">TD</div>
                <div className="bg-white px-5 py-3 rounded-[1.4rem] rounded-tl-none border border-coral-100 shadow-sm flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-coral-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-coral-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-coral-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                  <span className="text-[10px] font-black text-coral-300 uppercase tracking-widest ml-1">Teacher is listening...</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 md:p-5 bg-white border-t border-pearl-50 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2 md:gap-3 items-end">
            {showMic && (
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500 text-white shadow-xl shadow-red-500/30 scale-110' 
                    : 'bg-pearl-100 text-gray-400 hover:bg-coral-50 hover:text-coral-500 active:scale-95'
                }`}
              >
                {isRecording ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black leading-none mb-1">{recordDuration}s</span>
                    <div className="flex gap-0.5">
                       {[1,2,3].map(i => <div key={i} className="w-0.5 h-2 bg-white rounded-full animate-pulse"></div>)}
                    </div>
                  </div>
                ) : <Icons.Mic />}
              </button>
            )}
            
            <div className="relative flex-1">
              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isRecording ? "Listening to you..." : "Type or record your English practice..."}
                disabled={isRecording}
                className="w-full pl-5 pr-14 py-3.5 md:py-4 bg-pearl-50 border border-pearl-200 rounded-[1.4rem] md:rounded-[1.8rem] focus:outline-none focus:ring-4 focus:ring-coral-500/5 focus:border-coral-500 text-gray-900 text-sm font-bold placeholder:text-gray-300 shadow-inner transition-all disabled:opacity-50 resize-none min-h-[56px] max-h-32"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isRecording}
                className="absolute right-2 bottom-2 w-8 h-8 md:w-10 md:h-10 bg-coral-500 text-white rounded-xl hover:bg-coral-600 disabled:opacity-20 transition-all shadow-lg active:scale-90 flex items-center justify-center"
              >
                <Icons.Send />
              </button>
            </div>
          </form>
          {isRecording && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="flex gap-1">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-red-400 rounded-full animate-pulse" 
                    style={{ height: `${Math.random() * 16 + 4}px`, animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">
                Recording... Release to send
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
