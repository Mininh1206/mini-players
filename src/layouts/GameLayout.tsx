
import React from 'react';

interface GameLayoutProps {
    children: React.ReactNode;
    title: string;
    onBack?: () => void;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children, title, onBack }) => {
    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30">
            {/* Header / Navbar */}
            <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
                 <div className="flex items-center gap-4">
                     <button 
                        onClick={() => window.history.back()} 
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Go Back"
                     >
                         ←
                     </button>
                     <h1 className="text-xl font-bold tracking-tight text-gray-100">{title}</h1>
                 </div>
                 
                 <div className="flex items-center gap-4">
                     {/* Placeholder for future global game controls (Volume, etc) */}
                     <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                     <span className="text-xs font-mono text-gray-500">ONLINE</span>
                 </div>
            </header>

            {/* Main Content Area */}
            <main className="p-4 lg:p-8 max-w-[1920px] mx-auto animate-fade-in">
                {children}
            </main>
        </div>
    );
};
