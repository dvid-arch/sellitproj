
import React from 'react';
import { X, ShieldCheck, Zap, MessageSquare, Plus, ArrowRight } from 'lucide-react';

interface AuthRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: () => void;
    action?: string;
}

export const AuthRequiredModal: React.FC<AuthRequiredModalProps> = ({ isOpen, onClose, onLogin, action = "perform this action" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
            <div className="relative w-full max-w-[440px] bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sellit via-sellit-dark to-sellit" />
                <button onClick={onClose} className="absolute top-8 right-8 p-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-full transition-all z-10">
                    <X size={20} />
                </button>

                <div className="p-10 pt-14 space-y-8 text-center">
                    <div className="w-20 h-20 bg-sellit/10 text-sellit rounded-[2rem] flex items-center justify-center mx-auto mb-2 animate-bounce-subtle">
                        <ShieldCheck size={40} className="stroke-[2.5]" />
                    </div>

                    <div>
                        <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Join the Community</h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            Please login or create an account to <span className="text-sellit font-bold">{action}</span> and join 5,000+ students buying safely.
                        </p>
                    </div>

                    <div className="space-y-4 py-2">
                        {[
                            { icon: Zap, label: "Boost your ads for 5x reach" },
                            { icon: MessageSquare, label: "Chat with verified students" },
                            { icon: Plus, label: "List your items for free" }
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-4 text-left px-4">
                                <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                                    <f.icon size={16} className="text-sellit" />
                                </div>
                                <p className="text-gray-700 font-bold text-sm tracking-tight">{f.label}</p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onLogin}
                        className="w-full bg-sellit text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-sellit/25 hover:bg-sellit-dark transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <span>Login or Join</span>
                        <ArrowRight size={20} />
                    </button>

                    <button onClick={onClose} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                        Keep Browsing as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};
