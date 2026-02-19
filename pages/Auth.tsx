
import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_USER, Icons } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !agreedToTerms) {
      alert("Please agree to the Terms of Use and Subscription Policy to continue.");
      return;
    }
    onLogin(MOCK_USER);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-pearl-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="text-coral-500 mb-4 animate-spin-slow">
            <Icons.Sun />
          </div>
          <h1 className="text-3xl font-black text-coral-500 tracking-tighter uppercase">
            Teacher Driza Community
          </h1>
          <p className="text-gray-500 mt-2 font-bold text-sm tracking-wide">
            Your alive community to master English
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-coral-900/5 p-8 border border-pearl-200">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${isLogin ? 'border-coral-500 text-coral-500' : 'border-transparent text-gray-300'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${!isLogin ? 'border-coral-500 text-coral-500' : 'border-transparent text-gray-300'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Email Address</label>
              <input 
                name="email"
                type="email" 
                required
                className="w-full px-5 py-4 bg-pearl-50 border border-pearl-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-coral-500/5 focus:border-coral-500 text-gray-900 font-bold transition-all placeholder:text-gray-300"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Password</label>
              <input 
                name="password"
                type="password" 
                required
                className="w-full px-5 py-4 bg-pearl-50 border border-pearl-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-coral-500/5 focus:border-coral-500 text-gray-900 font-bold transition-all placeholder:text-gray-300"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            {!isLogin && (
              <div className="pt-4 border-t border-pearl-100 space-y-4">
                <div className="bg-coral-50 p-4 rounded-2xl border border-coral-100">
                  <p className="text-[11px] text-coral-700 font-black uppercase tracking-wider leading-relaxed text-center">
                    ✨ 2 days free trial. No charge today.
                  </p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Cardholder Name</label>
                  <input 
                    name="cardName"
                    type="text" 
                    required
                    className="w-full px-5 py-4 bg-pearl-50 border border-pearl-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-coral-500/5 focus:border-coral-500 text-gray-900 font-bold"
                    placeholder="NAME ON CARD"
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Card Number</label>
                  <input 
                    name="cardNumber"
                    type="text" 
                    required
                    className="w-full px-5 py-4 bg-pearl-50 border border-pearl-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-coral-500/5 focus:border-coral-500 text-gray-900 font-bold"
                    placeholder="0000 0000 0000 0000"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Expiry</label>
                    <input 
                      name="expiry"
                      type="text" 
                      required
                      className="w-full px-5 py-4 bg-pearl-50 border border-pearl-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-coral-500/5 focus:border-coral-500 text-gray-900 font-bold"
                      placeholder="MM/YY"
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">CVV</label>
                    <input 
                      name="cvv"
                      type="text" 
                      required
                      className="w-full px-5 py-4 bg-pearl-50 border border-pearl-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-coral-500/5 focus:border-coral-500 text-gray-900 font-bold"
                      placeholder="123"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-4 w-4 rounded border-pearl-300 text-coral-500 focus:ring-coral-500 cursor-pointer"
                    />
                  </div>
                  <label htmlFor="terms" className="text-[11px] text-gray-500 font-medium leading-tight cursor-pointer">
                    By creating an account, you agree to the <span className="text-coral-500 font-bold underline">Terms of Use</span> and <span className="text-coral-500 font-bold underline">Subscription Policy</span>.
                  </label>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={!isLogin && !agreedToTerms}
              className={`w-full py-5 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all transform active:scale-[0.98] mt-6 ${
                (!isLogin && !agreedToTerms) 
                  ? 'bg-gray-300 shadow-none cursor-not-allowed' 
                  : 'bg-coral-500 hover:bg-coral-600 shadow-coral-500/20'
              }`}
            >
              {isLogin ? 'Enter Community' : 'Start My Trial'}
            </button>
            
            <p className="text-center text-[9px] text-gray-400 mt-4 font-black uppercase tracking-[0.2em]">
              Secure Billing by Asaas • 100% Encrypted
            </p>
          </form>
        </div>
      </div>
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Auth;
