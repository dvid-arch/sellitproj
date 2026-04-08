
import React from 'react';
import { CheckCircle2, Share2, ArrowRight, Sparkles, Plus, Home } from 'lucide-react';

interface PublicationSuccessProps {
    isOpen: boolean;
    onClose: () => void;
    onViewListing: () => void;
    onListAnother: () => void;
    onShare?: () => void;
    title?: string;
    isUpdate?: boolean;
}

export const PublicationSuccess: React.FC<PublicationSuccessProps> = ({
    isOpen,
    onClose,
    onViewListing,
    onListAnother,
    onShare,
    title = "Your item",
    isUpdate = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />
            <div className="relative w-full max-w-[500px] bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

                <div className="p-10 text-center space-y-8">
                    <div className="relative w-24 h-24 mx-auto mb-2">
                        <div className="absolute inset-0 bg-green-100 rounded-[2.5rem] animate-ping opacity-20" />
                        <div className="relative w-full h-full bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-green-200/50">
                            <CheckCircle2 size={48} className="stroke-[2.5]" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <Sparkles size={16} fill="white" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
                            {isUpdate ? "Update Saved!" : "Product Live!"}
                        </h2>
                        <p className="text-gray-500 font-medium leading-relaxed">
                            <span className="text-gray-900 font-bold">"{title}"</span> {isUpdate ? "has been updated." : "is now visible to all students on campus."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-4">
                        <button
                            onClick={onViewListing}
                            className="w-full bg-sellit text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-sellit/20 hover:bg-sellit-dark transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            <span>View My Listing</span>
                            <ArrowRight size={20} />
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onListAnother}
                                className="flex items-center justify-center gap-2 py-4 px-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all border border-gray-100"
                            >
                                <Plus size={18} />
                                <span>List Another</span>
                            </button>
                            <button
                                onClick={onShare}
                                className="flex items-center justify-center gap-2 py-4 px-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all border border-gray-100"
                            >
                                <Share2 size={18} />
                                <span>Share Ad</span>
                            </button>
                        </div>
                    </div>

                    <button onClick={onClose} className="flex items-center gap-2 mx-auto text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">
                        <Home size={14} />
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};
