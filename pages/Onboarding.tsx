
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { Icons } from '../constants';
import { validateProfilePicture } from '../services/geminiService';

interface OnboardingProps {
  user: User;
  onComplete: (data: Partial<User>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user.name || '',
    handle: user.handle || '',
    avatarUrl: user.avatarUrl || '',
    level: 'intermediate',
    goal: 'confidence',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Maximum size is 5MB.");
      return;
    }

    setIsValidating(true);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const isSafe = await validateProfilePicture(base64);
        if (isSafe) {
          setFormData({ ...formData, avatarUrl: reader.result as string });
          setError(null);
        } else {
          setError("Image content issue. Please use another.");
          setFormData({ ...formData, avatarUrl: '' });
        }
      } catch (err) {
        setError("Process error. Try again.");
      } finally {
        setIsValidating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!formData.handle.trim()) {
        setError("Pick a handle.");
        return;
      }
    }
    setError(null);
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-pearl-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-premium p-6 sm:p-12 border border-pearl-200 relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="flex gap-1.5 mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                step >= s ? 'bg-coral-500' : 'bg-pearl-100'
              }`}
            ></div>
          ))}
        </div>

        <div className="mb-8">
           <h2 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight leading-tight mb-2">
             {step === 1 && "The Basics"}
             {step === 2 && "Your Current Level"}
             {step === 3 && "Your Main Goal"}
           </h2>
           <p className="text-gray-500 font-bold text-xs sm:text-sm">
             {step === 1 && "How should we call you?"}
             {step === 2 && "Driza will adjust to your pace."}
             {step === 3 && "Let's focus on what matters most."}
           </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in shake">
            <p className="text-red-600 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
          </div>
        )}

        <div className="min-h-[300px] flex flex-col">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => !isValidating && fileInputRef.current?.click()}
                  className={`relative w-24 h-24 rounded-[1.8rem] bg-pearl-50 border-2 border-dashed flex items-center justify-center cursor-pointer group overflow-hidden transition-all ${
                    isValidating ? 'border-coral-300' : 'border-pearl-200 hover:border-coral-500'
                  }`}
                >
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <div className="text-gray-300 group-hover:text-coral-500 transition-colors">
                      <Icons.Camera />
                    </div>
                  )}
                  {isValidating && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-coral-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-3">Profile Photo (Optional)</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3.5 bg-white border-2 border-pearl-100 focus:border-coral-500 rounded-xl outline-none text-gray-900 font-bold transition-all placeholder:text-gray-300"
                    placeholder="E.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Community Handle</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">@</span>
                    <input 
                      type="text" 
                      value={formData.handle.replace('@', '')}
                      onChange={(e) => setFormData({...formData, handle: `@${e.target.value.toLowerCase().replace(/\s+/g, '')}`})}
                      className="w-full pl-9 pr-4 py-3.5 bg-white border-2 border-pearl-100 focus:border-coral-500 rounded-xl outline-none text-gray-900 font-bold transition-all placeholder:text-gray-300"
                      placeholder="handle"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
              {[
                { id: 'beginner', label: 'Beginner', desc: 'Starting from zero.' },
                { id: 'intermediate', label: 'Intermediate', desc: 'Can understand, struggle to speak.' },
                { id: 'advanced', label: 'Advanced', desc: 'Polishing for professional use.' }
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setFormData({...formData, level: lvl.id})}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                    formData.level === lvl.id ? 'border-coral-500 bg-coral-50/20' : 'border-pearl-100 hover:border-pearl-200'
                  }`}
                >
                  <p className="font-black text-gray-950 uppercase tracking-tighter text-sm mb-0.5">{lvl.label}</p>
                  <p className="text-[10px] text-gray-500 font-bold leading-relaxed">{lvl.desc}</p>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-500">
              {[
                { id: 'career', label: 'Global Career', icon: '💼' },
                { id: 'confidence', label: 'Social Confidence', icon: '🍷' },
                { id: 'travel', label: 'Freedom & Travel', icon: '✈️' }
              ].map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setFormData({...formData, goal: goal.id})}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all active:scale-[0.98] ${
                    formData.goal === goal.id ? 'border-coral-500 bg-coral-50/20' : 'border-pearl-100 hover:border-pearl-200'
                  }`}
                >
                  <span className="text-xl">{goal.icon}</span>
                  <p className="font-black text-gray-950 uppercase tracking-tight text-xs">{goal.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-10">
          {step > 1 && (
            <button onClick={prevStep} className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest text-[10px] active:scale-90 transition-all">Back</button>
          )}
          <button 
            onClick={step === 3 ? () => onComplete(formData) : nextStep}
            disabled={isValidating}
            className="flex-[2] py-4 bg-coral-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {step === 3 ? "Launch Journey" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
