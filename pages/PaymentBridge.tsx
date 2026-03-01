import React, { useState, useEffect } from 'react';
import { Icons } from '../constants';
import { api } from '../services/api';

interface PaymentBridgeProps {
  onPaymentConfirmed: () => void;
}

const PaymentBridge: React.FC<PaymentBridgeProps> = ({ onPaymentConfirmed }) => {
  const [status, setStatus] = useState<'redirecting' | 'error' | 'success'>('redirecting');

  useEffect(() => {
    const redirectToCheckout = async () => {
      try {
        const checkoutUrl = await api.billing.getCheckoutUrl('subscription');
        window.location.href = checkoutUrl; // Redirect to Asaas
      } catch (error) {
        console.error("Checkout error:", error);
        setStatus('error');
      }
    };

    redirectToCheckout();
  }, []);

  // If user returns from Asaas (webhook will update their status)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Poll for payment confirmation
      const interval = setInterval(async () => {
        const user = await api.auth.getCurrentUser();
        if (user && user.subscription.status === 'active') {
          clearInterval(interval);
          setStatus('success');
          setTimeout(onPaymentConfirmed, 2000);
        }
      }, 3000);

      return () => clearInterval(interval);
    };

    if (status === 'redirecting') {
      checkPaymentStatus();
    }
  }, [status, onPaymentConfirmed]);

  return (
    <div className="min-h-screen bg-pearl-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-pearl-200 animate-in zoom-in duration-500">
        {status === 'redirecting' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-coral-50 rounded-full flex items-center justify-center mx-auto">
              <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Redirecionando...</h2>
            <p className="text-gray-500 font-medium">Estamos te levando para o ambiente seguro de pagamento do Asaas.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Icons.CreditCard />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Erro no Checkout</h2>
            <p className="text-gray-500 font-medium">Não conseguimos processar o pagamento. Tente novamente.</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-coral-500 text-white font-black rounded-2xl"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
              <Icons.Check />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Pagamento Confirmado!</h2>
            <p className="text-gray-500 font-medium">Seja bem-vindo à comunidade. Vamos configurar seu perfil para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentBridge;
