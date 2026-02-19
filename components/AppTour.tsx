
import React, { useState } from 'react';
import { Icons } from '../constants';

interface TourStep {
  title: string;
  content: string;
  badge: string;
}

const steps: TourStep[] = [
  {
    title: "English-Only Zone 🌎",
    content: "To unlock your fluency, this entire platform is in English. We encourage you to always try your best to communicate in English here. It's the only way to grow!",
    badge: "IMMERSION"
  },
  {
    title: "Safe & Healthy Space ✨",
    content: "Our community is a safe haven. Be supportive, kind, and respectful. No judgment allowed—everyone is here to learn and mistakes are our best teachers.",
    badge: "WELL-BEING"
  },
  {
    title: "Your Private Teacher 👩‍🏫",
    content: "In your Private Chat, you can speak freely with Teacher Driza. Send audios or text 24/7. She's here to correct you gently and guide your path.",
    badge: "LEARNING"
  },
  {
    title: "Keep it Real 🚀",
    content: "Try to spend at least 15 minutes a day interacting. Whether it's answering a community prompt or chatting with Driza, consistency is your superpower.",
    badge: "CONSISTENCY"
  }
];

interface AppTourProps {
  onComplete: () => void;
}

const AppTour: React.FC<AppTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="max-w-sm w-full bg-white rounded-[3rem] p-10 md:p-12 shadow-[0_35px_60px_-15px_rgba(240,113,103,0.3)] animate-in zoom-in duration-300 relative overflow-hidden border border-coral-100">
        
        {/* Progress Dots */}
        <div className="flex gap-1.5 mb-8 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentStep ? 'bg-coral-500 w-8' : 'bg-pearl-100 w-2'}`}></div>
          ))}
        </div>

        <div className="text-center">
          <span className="inline-block px-3 py-1 bg-coral-50 text-coral-600 text-[10px] font-black uppercase tracking-widest rounded-full mb-6">
            {step.badge}
          </span>
          
          <h3 className="text-2xl font-black text-gray-950 tracking-tighter uppercase mb-4 leading-tight">
            {step.title}
          </h3>
          
          <p className="text-gray-500 font-bold mb-10 leading-relaxed text-sm">
            {step.content}
          </p>

          <button 
            onClick={next}
            className="w-full py-5 bg-coral-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-coral-500/20 hover:bg-coral-600 transition-all flex items-center justify-center gap-2 group active:scale-95"
          >
            {currentStep === steps.length - 1 ? "LET'S START!" : "GOT IT, NEXT"} 
            <Icons.ArrowRight />
          </button>
        </div>

        <div className="mt-8 text-center">
           <p className="text-[9px] text-gray-300 font-black uppercase tracking-[0.3em]">Teacher Driza Experience</p>
        </div>
      </div>
    </div>
  );
};

export default AppTour;
