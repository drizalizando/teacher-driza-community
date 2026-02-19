
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface BillingProps {
  user: User;
}

const Billing: React.FC<BillingProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const isTrial = user.subscription.status === 'trialing';
  const isActive = user.subscription.status === 'active' || user.subscription.status === 'trialing';
  const isBlocked = user.subscription.isAccessBlocked;

  const handleUpdatePayment = async () => {
    setLoading(true);
    try {
      const checkoutUrl = await api.billing.getCheckoutUrl('premium-monthly');
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error(err);
      alert("Error generating payment link.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Assinatura e Faturamento</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Plan */}
        <div className={`bg-white p-8 rounded-2xl border ${isBlocked ? 'border-red-200 shadow-red-500/5' : 'border-pearl-200 shadow-sm'} flex flex-col`}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Membro Premium</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">R$ 33<span className="text-sm font-normal text-gray-400">/mês</span></p>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status da Assinatura:</span>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              isActive && !isBlocked
                ? 'bg-green-50 border-green-100 text-green-700' 
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${(isActive && !isBlocked) ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isBlocked ? 'Bloqueada' : isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-8 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-coral-400"></div>
              <span>Chats ilimitados com Teacher Driza</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-coral-400"></div>
              <span>Acesso à comunidade global de alunos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-coral-400"></div>
              <span>Desafios diários de conversação</span>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-pearl-50">
            {isBlocked ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                  <p className="text-xs text-red-700 leading-relaxed font-bold">
                    ⚠️ Pagamento não processado. Atualize seu método de pagamento para reativar o acesso.
                  </p>
                </div>
                <button 
                  onClick={handleUpdatePayment}
                  disabled={loading}
                  className="w-full py-3 bg-coral-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-coral-500/20"
                >
                  {loading ? 'Redirecionando...' : 'Atualizar Pagamento'}
                </button>
              </div>
            ) : isTrial ? (
              <div className="bg-pearl-100 border border-pearl-200 p-4 rounded-xl">
                <p className="text-xs text-gray-600 leading-relaxed font-medium">
                  Seu teste de 2 dias termina em <strong>{new Date(user.subscription.trialEndDate).toLocaleDateString()}</strong>. 
                  A primeira cobrança será automática após esta data via Asaas.
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium">
                Próximo faturamento: <strong>{new Date(user.subscription.nextBillingDate || Date.now()).toLocaleDateString()}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white p-8 rounded-2xl border border-pearl-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Método de Pagamento</h3>
          <div className="flex items-center gap-4 p-4 border border-pearl-200 rounded-xl mb-6 bg-pearl-50">
            <div className="w-12 h-8 bg-white border border-pearl-200 rounded-md flex items-center justify-center font-bold text-[10px] text-gray-400">CARD</div>
            <div>
              <p className="text-sm font-bold text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-400 font-medium">Expira 12/28</p>
            </div>
            <button onClick={handleUpdatePayment} className="ml-auto text-xs font-bold text-coral-500 hover:text-coral-600">Editar</button>
          </div>

          <div className="space-y-3">
            <button className="w-full py-3 bg-pearl-100 hover:bg-pearl-200 text-gray-700 font-bold rounded-xl text-sm transition-colors">
              Histórico de Faturas
            </button>
            {!isBlocked && (
              <button 
                onClick={() => { if(confirm("Deseja cancelar a assinatura?")) api.billing.cancelSubscription(user.id); }}
                className="w-full py-3 text-coral-400 hover:bg-coral-50 font-bold rounded-xl text-sm transition-colors"
              >
                Cancelar Assinatura
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
