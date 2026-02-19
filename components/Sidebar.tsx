
import React from 'react';
import { Icons } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const menuItems = [
    { id: 'public', label: 'Public Chat', icon: Icons.Users },
    { id: 'private', label: 'Private Teacher', icon: Icons.MessageSquare },
    { id: 'billing', label: 'Subscription', icon: Icons.CreditCard },
    { id: 'settings', label: 'Account Settings', icon: Icons.Settings },
  ];

  return (
    <aside className="w-72 bg-white border-r border-pearl-200 flex flex-col h-full hidden md:flex">
      <div className="p-8">
        <div className="flex flex-col gap-2 mb-10 items-start">
          <div className="text-coral-500 mb-2">
            <Icons.Sun />
          </div>
          <h1 className="text-xl font-black text-coral-500 leading-tight tracking-tighter uppercase">
            Teacher Driza<br/>
            Community
          </h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-300 ${
                activeTab === item.id
                  ? 'bg-coral-500 text-white shadow-xl shadow-coral-500/20 translate-x-2'
                  : 'text-gray-600 hover:bg-pearl-50 hover:text-gray-950'
              }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-pearl-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 text-sm font-bold text-gray-500 hover:text-coral-600 hover:bg-coral-50 rounded-2xl transition-all duration-300"
        >
          <Icons.LogOut />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
