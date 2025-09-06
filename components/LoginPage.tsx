
import React from 'react';
import Icon from './Icon';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen landing-background text-white p-8 text-center animate-fade-in">
      <div className="absolute top-8 left-8 flex items-center space-x-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
        <Icon name="ShieldCheck" size={16} className="text-white/80" />
        <p className="text-sm font-medium text-white/80">Preserve Your Legacy for Future Generations</p>
      </div>

      <main className="flex flex-col items-center">
        <h1 className="text-8xl font-extrabold text-shadow">
          Legacy<span className="text-brand-gold">Link</span>
        </h1>
        <p className="max-w-2xl mt-4 text-xl text-slate-200 text-shadow">
          A futuristic family tree and digital heritage platform that preserves memories, connects generations, and celebrates legacies across <strong>27 generations</strong>.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLogin}
            className="flex items-center justify-center w-64 px-8 py-4 text-lg font-bold text-white bg-brand-blue-light rounded-lg shadow-lg transition-transform transform hover:scale-105 hover:bg-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/50"
          >
            Start Your Legacy
            <Icon name="ArrowRight" size={20} className="ml-2" />
          </button>
          <button
            onClick={() => alert('Feature exploration is coming soon!')}
            className="flex items-center justify-center w-64 px-8 py-4 text-lg font-bold text-white bg-white/10 rounded-lg shadow-lg backdrop-blur-sm border border-white/20 transition-transform transform hover:scale-105 hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
          >
            Explore Features
          </button>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
