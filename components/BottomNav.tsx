
import React from 'react';
import { Icons } from '../constants';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'public', label: 'Feed', icon: Icons.Users },
    { id: 'private', label: 'Teacher', icon: Icons.MessageSquare },
    { id: 'billing', label: 'Plan', icon: Icons.CreditCard },
    { id: 'settings', label: 'Me', icon: Icons.Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-pearl-200 shadow-mobile-nav px-2 pb-safe-area-inset-bottom z-50 flex justify-around items-center h-16 sm:h-20">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className="flex flex-col items-center justify-center flex-1 h-full relative"
        >
          <div className={`transition-all duration-300 p-2 rounded-xl ${
            activeTab === item.id ? 'bg-coral-500 text-white shadow-lg -translate-y-1' : 'text-gray-400'
          }`}>
            <item.icon />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-all ${
            activeTab === item.id ? 'text-coral-600 opacity-100' : 'text-gray-300 opacity-0'
          }`}>
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
