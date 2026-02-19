
import React from 'react';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'public', label: 'Community', icon: Icons.Users },
    { id: 'private', label: 'My Teacher', icon: Icons.MessageSquare },
    { id: 'billing', label: 'Subscription', icon: Icons.CreditCard },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <aside className="w-80 bg-white border-r border-pearl-200 flex flex-col h-full hidden lg:flex relative z-10">
      <div className="p-10">
        <div className="flex items-center gap-3 mb-12">
          <div className="text-coral-500 scale-125"><Icons.Sun /></div>
          <h1 className="text-xl font-black text-gray-950 tracking-tighter uppercase leading-none">
            Teacher<br/>Driza
          </h1>
        </div>

        <nav className="space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4.5 text-sm font-extrabold rounded-2xl transition-all ${
                activeTab === item.id
                  ? 'bg-coral-500 text-white shadow-premium translate-x-1'
                  : 'text-gray-400 hover:text-gray-950 hover:bg-pearl-50'
              }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
        >
          <Icons.LogOut />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
