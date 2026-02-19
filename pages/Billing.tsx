
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Icons } from '../constants';

interface BillingProps {
  user: User;
}

const Billing: React.FC<BillingProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const isTrial = user.subscription.status === 'trialing';
  const isActive = user.subscription.status === 'active' || user.subscription.status === 'trialing';
  const isBlocked = user.subscription.isAccessBlocked;

  const handleOpenAsaasPortal = async () => {
    setLoading(true);
    try {
      const portalUrl = await api.billing.getCheckoutUrl('portal');
      window.open(portalUrl, '_blank');
    } catch (err) {
      alert("Error connecting to gateway.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto py-6 md:py-12 px-2 md:px-4 animate-in fade-in duration-500 pb-24 lg:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12 px-2">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-950 tracking-tighter uppercase">Subscription</h2>
          <p className="text-gray-400 font-bold text-[10px] md:text-sm tracking-wide">Plan & Billing management</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border self-start flex items-center gap-2 ${
          isActive && !isBlocked ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive && !isBlocked ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isBlocked ? 'Access Blocked' : isTrial ? '7-Day Free Trial' : 'Active Member'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-14 border border-pearl-200 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-coral-50/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-end gap-2 mb-8 md:mb-10">
            <span className="text-5xl md:text-6xl font-black tracking-tighter text-gray-950">R$ 33</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">/ month</span>
          </div>

          <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
             {[
               "Full access to Teacher Driza",
               "Global Community Chat",
               "Voice Feedback system"
             ].map((feature, i) => (
               <div key={i} className="flex items-center gap-3 text-gray-600">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-coral-100 text-coral-600 flex items-center justify-center shrink-0">
                    <Icons.Check />
                  </div>
                  <p className="text-xs md:text-sm font-bold">{feature}</p>
               </div>
             ))}
          </div>

          <div className="p-5 md:p-8 bg-pearl-50 rounded-2xl md:rounded-[2rem] border border-pearl-100 mb-8 md:mb-10">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Charge</span>
                <span className="text-xs md:text-sm font-black text-gray-950">
                  {isTrial ? new Date(user.subscription.trialEndDate).toLocaleDateString() : 'Automatic'}
                </span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Processor</span>
                <span className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                   Asaas <Icons.Check />
                </span>
             </div>
          </div>

          <button 
            onClick={handleOpenAsaasPortal}
            disabled={loading}
            className="w-full py-4 md:py-6 bg-gray-950 text-white font-black uppercase tracking-widest rounded-2xl md:rounded-3xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? 'Connecting...' : 'Manage Payments'}
            <Icons.ArrowRight />
          </button>
          
          <p className="text-center text-[8px] text-gray-400 font-black uppercase tracking-widest mt-6">
            Secured link. Manage card & plan.
          </p>
        </div>
      </div>
      
      {/* Spacer for bottom navigation on small screens */}
      <div className="h-20 lg:hidden"></div>
    </div>
  );
};

export default Billing;
