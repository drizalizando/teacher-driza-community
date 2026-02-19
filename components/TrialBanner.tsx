
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
        setTimeLeft('Trial Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [user.subscription.trialEndDate]);

  if (user.subscription.status !== 'trialing') return null;

  const isUrgent = timeLeft.includes('Trial Expired') || (!timeLeft.includes('d') && parseInt(timeLeft) < 12);

  return (
    <div className={`w-full py-2 px-4 text-center text-[10px] md:text-sm font-black uppercase tracking-widest transition-colors ${
      isUrgent ? 'bg-red-50 text-red-700 border-b border-red-100' : 'bg-coral-50 text-coral-700 border-b border-coral-100'
    }`}>
      <span className="inline-flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUrgent ? 'bg-red-400' : 'bg-coral-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isUrgent ? 'bg-red-500' : 'bg-coral-500'}`}></span>
        </span>
        {isUrgent ? "Your trial is ending soon!" : "You are enjoying your free trial."} 
        <strong className="ml-1 text-gray-900">{timeLeft}</strong>
      </span>
      <button className="ml-4 underline hover:no-underline opacity-60 hover:opacity-100 transition-opacity">Manage Plan</button>
    </div>
  );
};

export default TrialBanner;
