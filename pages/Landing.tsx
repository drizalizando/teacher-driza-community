
import React from 'react';
import { Icons } from '../constants';

interface LandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="bg-pearl-50 min-h-screen font-sans text-gray-900 overflow-x-hidden selection:bg-coral-200 pb-20 md:pb-0">
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-pearl-50/80 backdrop-blur-xl border-b border-pearl-200 px-4 md:px-6 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="text-coral-500 scale-75">
              <Icons.Sun />
            </div>
            <span className="text-sm md:text-lg font-black text-coral-500 tracking-tighter uppercase">Teacher Driza</span>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <button onClick={onLogin} className="hidden sm:block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 hover:text-coral-500 transition-colors">Entrar</button>
            <button onClick={onGetStarted} className="px-4 md:px-6 py-2.5 md:py-3 bg-coral-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-xl md:rounded-2xl shadow-xl shadow-coral-500/20 active:scale-95 transition-all">Começar</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 md:pb-32 px-4 md:px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-radial-gradient from-coral-100/40 to-transparent -z-10 blur-[120px] opacity-60"></div>
        
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-8xl font-black text-gray-950 tracking-tighter leading-[1] md:leading-[0.85] mb-6 md:mb-8 max-w-5xl mx-auto">
            CANSADO DE SER O <span className="text-coral-500 italic">ETERNO ESTUDANTE</span><br className="hidden md:block" />
            QUE NUNCA SE SENTE <span className="text-coral-500">PRONTO PARA FALAR?</span>
          </h1>
          
          <p className="text-base md:text-xl text-gray-500 font-medium max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed px-2">
            Fluência não é um selo, um nível ou um certificado. É sobre a liberdade de <b>fluir</b>. 
            Chega de métodos ineficientes que te prendem em regras. Destrave seu inglês através da prática real.
          </p>

          <div className="flex flex-col items-center gap-4 md:gap-6">
            <button onClick={onGetStarted} className="group relative w-full md:w-auto px-10 md:px-12 py-5 md:py-7 bg-coral-500 text-white font-black uppercase tracking-widest rounded-2xl md:rounded-[2rem] shadow-2xl shadow-coral-500/40 active:scale-95 transition-all text-xs md:text-sm">
              <span className="relative z-10 flex items-center gap-3 justify-center">
                Quero Fluir no Inglês Agora <Icons.ArrowRight />
              </span>
            </button>
            <p className="text-[9px] md:text-[11px] text-gray-400 font-black uppercase tracking-widest">Inicie seu teste de 7 dias • Sem cobranças hoje</p>
          </div>
        </div>
      </section>

      {/* Pain Section - O Ciclo da Ineficiência */}
      <section className="bg-white py-16 md:py-32 border-y border-pearl-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-24 items-center">
          <div className="order-2 lg:order-1">
             <h2 className="text-3xl md:text-6xl font-black text-gray-950 tracking-tighter uppercase leading-[1] mb-6 md:mb-10">
               VOCÊ NÃO PRECISA DE MAIS <span className="text-coral-500">GRAMÁTICA.</span><br/>
               VOCÊ PRECISA DE <span className="text-coral-500">FLUXO.</span>
             </h2>
             <p className="text-base md:text-lg text-gray-600 font-medium mb-8 md:mb-12 leading-relaxed">
               Escolas tradicionais lucram com a sua demora. Elas te rotulam como "básico" ou "intermediário" para te manter pagando mensalidades por years. A verdade? A fala acontece no erro, na interação e no dia a dia.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
               {[
                 { title: "A Armadilha do 'Ainda Não'", desc: "Você estuda há anos mas acha que precisa de 'mais um curso' antes de abrir a boca." },
                 { title: "Foco no Rótulo", desc: "Se preocupar se é B1 ou B2 ao invés de se preocupar se consegue pedir um café ou liderar uma reunião." },
                 { title: "Vergonha de Errar", desc: "A paralisia que vem de achar que o seu inglês precisa ser perfeito para ser válido." },
                 { title: "Métodos de 1990", desc: "Livros didáticos chatos que não acompanham a velocidade da vida moderna." }
               ].map((item, i) => (
                 <div key={i} className="p-5 md:p-6 bg-pearl-50 rounded-2xl md:rounded-3xl border border-pearl-100 group transition-all">
                   <h3 className="font-black text-gray-900 uppercase text-[10px] md:text-xs mb-2 tracking-widest text-coral-500">{item.title}</h3>
                   <p className="text-[11px] md:text-xs text-gray-500 font-bold leading-relaxed">{item.desc}</p>
                 </div>
               ))}
             </div>
          </div>
          <div className="relative order-1 lg:order-2">
             <div className="absolute inset-0 bg-coral-500/5 blur-[80px] rounded-full"></div>
             <div className="relative z-10 bg-gray-950 rounded-[2rem] md:rounded-[3rem] p-8 md:p-14 text-white shadow-3xl">
                <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase mb-4 md:mb-6 leading-tight text-coral-400">
                  O NOSSO CONCEITO:
                </h3>
                <p className="text-gray-400 text-sm md:text-lg font-medium leading-relaxed mb-8">
                  Nós matamos o "eterno estudante". Aqui, a fluência é tratada como um músculo que se exercita em um ambiente seguro, sem julgamentos e com suporte tecnológico de ponta.
                </p>
                <div className="flex flex-col gap-4">
                  {[
                    "Fim do medo de abrir o microfone",
                    "Inglês aplicado ao seu contexto real",
                    "Uma guia que te entende e te incentiva"
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-coral-500 rounded-full flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                      <span className="text-xs md:text-sm font-bold">{text}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Por que a Driza? */}
      <section className="py-16 md:py-32 bg-pearl-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4 md:mb-6 leading-none">O FIM DA INÉRCIA.</h2>
            <p className="text-gray-500 font-bold text-sm md:text-lg px-4">Saia do modo passivo. Na Teacher Driza Community, você é o protagonista da sua fala.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { title: "PRÁTICA 1:1 ILIMITADA", icon: <Icons.MessageSquare />, text: "Tem uma entrevista amanhã? Envie um áudio. A Driza responde com correções detalhadas e suporte total." },
              { title: "O HUB GLOBAL", icon: <Icons.Users />, text: "Nosso chat é onde o aprendizado ganha vida. Tópicos diários para fazer você pensar e falar inglês real." },
              { title: "IMERSÃO DE 15 MINUTOS", icon: <Icons.Sun />, text: "Consistência é a chave. Focamos em interações de alto impacto que mantêm seu inglês ativo o dia todo." }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-pearl-200 shadow-soft relative overflow-hidden flex flex-col items-center text-center">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-coral-50 text-coral-500 rounded-2xl flex items-center justify-center mb-6 md:mb-10">
                  {feature.icon}
                </div>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter mb-4">{feature.title}</h3>
                <p className="text-sm md:text-base text-gray-500 font-medium leading-relaxed">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="py-16 md:py-32 bg-gray-950 text-white text-center">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-[1] md:leading-[0.85] mb-12">
            CHEGA DE ESPERAR O <span className="text-coral-400 italic">MOMENTO IDEAL.</span>
          </h2>
          
          <div className="max-w-xl mx-auto">
            <div className="p-8 md:p-12 bg-coral-500 rounded-3xl shadow-2xl shadow-coral-500/20 relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/80 mb-3">Comunidade Driza</p>
                <div className="text-6xl md:text-7xl font-black mb-2">R$ 33<span className="text-base md:text-xl font-normal opacity-60">/mês</span></div>
                <p className="text-[10px] md:text-xs text-white font-black uppercase tracking-widest">Foco total em fluxo e prática real</p>
                <div className="mt-8 flex flex-col gap-3 items-center">
                  <div className="flex items-center gap-2 text-white/90 text-[10px] md:text-xs font-bold">
                    <Icons.Check /> Acesso 24/7 a Teacher Driza
                  </div>
                  <div className="flex items-center gap-2 text-white/90 text-[10px] md:text-xs font-bold">
                    <Icons.Check /> Comunidade Global de Prática
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 md:mt-20 px-2">
            <button onClick={onGetStarted} className="w-full md:w-auto px-10 md:px-12 py-5 md:py-7 bg-white text-gray-950 font-black uppercase tracking-widest rounded-2xl hover:bg-coral-500 hover:text-white transition-all text-xs md:text-sm">
              Começar Meus 7 Dias de Fluxo Grátis
            </button>
            <p className="mt-4 md:mt-6 text-[8px] md:text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Cancele quando quiser. Sinta a diferença no primeiro dia.</p>
          </div>
        </div>
      </section>

      <footer className="py-12 md:py-20 bg-white border-t border-pearl-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-8 md:gap-10 items-center">
          <div className="flex flex-col items-center gap-2">
            <div className="text-coral-500 scale-75"><Icons.Sun /></div>
            <span className="text-sm md:text-lg font-black text-coral-500 tracking-tighter uppercase">Teacher Driza</span>
          </div>
          <p className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] text-center">
            © 2026 TEACHER DRIZA • FLUÊNCIA É SOBRE FLUIR
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
