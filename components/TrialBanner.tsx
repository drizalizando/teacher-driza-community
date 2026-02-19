
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface TrialBannerProps {
  user: User;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ user }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const end = new Date(user.subscription.trialEndDate);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Trial Ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m left`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [user.subscription.trialEndDate]);

  if (user.subscription.status !== 'trialing') return null;

  const isUrgent = timeLeft.includes('Trial Ended') || parseInt(timeLeft) < 12;

  return (
    <div className={`w-full py-2 px-4 text-center text-sm font-medium transition-colors ${
      isUrgent ? 'bg-red-50 text-red-700 border-b border-red-100' : 'bg-coral-50 text-coral-700 border-b border-coral-100'
    }`}>
      <span className="inline-flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUrgent ? 'bg-red-400' : 'bg-coral-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isUrgent ? 'bg-red-500' : 'bg-coral-500'}`}></span>
        </span>
        {isUrgent ? "Seu período de teste está acabando!" : "Você está no período de 2 dias de teste gratuito."} 
        <strong className="ml-1">{timeLeft}</strong>
      </span>
      <button className="ml-4 underline hover:no-underline font-semibold">Gerenciar Assinatura</button>
    </div>
  );
};

export default TrialBanner;
