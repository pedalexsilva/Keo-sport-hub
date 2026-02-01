import React from 'react';
import { Download, Calendar, ChevronDown } from 'lucide-react';
import { useCMS } from '../../hooks/useCMS';

const HeroSection: React.FC = () => {
    const { data: config } = useCMS();

    if (!config) return null;

    return (
        <header className="relative flex flex-col items-center">
            {/* Full Width Hero Image or Video */}
            <div className="w-full h-[50vh] md:h-[70vh] relative overflow-hidden bg-gray-100">
                {config.heroImage?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <video
                        src={config.heroImage}
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                ) : (
                    <img
                        src={config.heroImage}
                        onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"; // Fallback
                        }}
                        alt="KEO Aerial View"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Content Section (Below Image, Corporate Style) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 md:-mt-20 relative z-10 w-full mb-12 md:mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-gray-100">
                    {config.announcement && <div className="bg-[#009CDE] text-white text-center py-2 px-4 rounded-full text-xs md:text-sm font-bold mb-4 inline-block">{config.announcement}</div>}
                    <span className="block text-[#009CDE] font-bold tracking-widest uppercase mb-2 md:mb-4 text-xs md:text-sm">Bem-estar Corporativo</span>
                    <h1 className="text-3xl md:text-6xl font-bold text-[#002D72] mb-4 md:mb-6 leading-tight">
                        {config.heroTitle}
                    </h1>
                    <p className="text-base md:text-xl text-gray-600 mb-8 md:mb-10 max-w-3xl font-light leading-relaxed">
                        {config.heroSubtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                        <a href="#app" className="px-6 py-3 md:px-8 md:py-4 bg-[#009CDE] text-white text-base md:text-lg rounded-full font-bold hover:bg-[#007bb5] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                            <Download className="w-5 h-5" /> Descarregar App
                        </a>
                        <a href="#eventos" className="px-6 py-3 md:px-8 md:py-4 bg-white border-2 border-[#002D72] text-[#002D72] text-base md:text-lg rounded-full font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer">
                            <Calendar className="w-5 h-5" /> Ver Eventos
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeroSection;
