
import React, { useState } from 'react';
import { User } from '../types';
import { Icons } from '../constants';
import { api } from '../services/api';

interface AuthProps {
  onLogin: (user: User) => void;
  onSignup: (email: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (!isLogin) {
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match.");
          return;
        }
        const user = await api.auth.signUp(formData.email, formData.password);
        if (user) {
          onLogin(user);
        } else {
          // Signup successful but might need email verification
          alert("Check your email for confirmation!");
          onSignup(formData.email);
        }
      } else {
        const user = await api.auth.signIn(formData.email, formData.password);
        if (user) {
          onLogin(user);
        }
      }
    } catch (error: any) {
      alert(error.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-pearl-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8 flex flex-col items-center px-4">
          <div className="text-coral-500 mb-4 animate-bounce-slow">
            <Icons.Sun />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tighter uppercase leading-none">
            Teacher Driza
          </h1>
          <p className="text-gray-400 mt-2 font-bold text-xs sm:text-sm tracking-wide">
            {isLogin ? "Welcome back, scholar!" : "Your journey starts here."}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-premium p-6 sm:p-10 border border-pearl-200">
          <div className="flex gap-2 mb-8 bg-pearl-50 p-1.5 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${isLogin ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-400'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!isLogin ? 'bg-white text-gray-950 shadow-sm' : 'text-gray-400'}`}
            >
              Join Us
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                name="email"
                type="email" 
                required
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-white border-2 border-pearl-100 rounded-xl sm:rounded-2xl focus:border-coral-500 outline-none text-gray-900 font-bold transition-all placeholder:text-gray-200"
                placeholder="name@email.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input 
                name="password"
                type="password" 
                required
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-white border-2 border-pearl-100 rounded-xl sm:rounded-2xl focus:border-coral-500 outline-none text-gray-900 font-bold transition-all placeholder:text-gray-200"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                <input 
                  name="confirmPassword"
                  type="password" 
                  required
                  className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-white border-2 border-pearl-100 rounded-xl sm:rounded-2xl focus:border-coral-500 outline-none text-gray-900 font-bold transition-all placeholder:text-gray-200"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 sm:py-5 bg-coral-500 text-white font-black uppercase tracking-widest text-[10px] sm:text-[11px] rounded-xl sm:rounded-2xl shadow-xl shadow-coral-500/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Enter Hub' : 'Start My Trial')}
            </button>
            
            <p className="text-center text-[8px] text-gray-300 font-black uppercase tracking-widest leading-relaxed mt-4">
              Secure payments powered by Asaas.
            </p>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Auth;
