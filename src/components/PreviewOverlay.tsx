import React from 'react';
import { Construction, Sparkles } from 'lucide-react';

interface PreviewOverlayProps {
    children: React.ReactNode;
    message?: string;
    subMessage?: string;
}

const PreviewOverlay: React.FC<PreviewOverlayProps> = ({
    children,
    message = "Preview Mode",
    subMessage = "This feature is currently under development."
}) => {
    return (
        <div className="relative w-full h-full min-h-[50vh] overflow-hidden">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none pointer-events-none opacity-50" aria-hidden="true">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="bg-white/90 backdrop-blur-md border border-white/50 shadow-xl rounded-3xl p-8 max-w-sm mx-auto transform hover:scale-105 transition-transform duration-500">
                    <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                        <Construction className="w-8 h-8 text-[#002D72]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#002D72] mb-2">{message}</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        {subMessage}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#009CDE] uppercase tracking-wider bg-blue-50 py-2 px-4 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        Coming Soon
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewOverlay;
