import React from 'react';
import { Download, Calendar, ChevronDown } from 'lucide-react';

const HeroSection: React.FC = () => {
    return (
        <header className="relative flex flex-col items-center">
            {/* Full Width Hero Image */}
            <div className="w-full h-[60vh] md:h-[70vh] relative overflow-hidden bg-gray-100">
                <img
                    src="/keo-aerial.jpg"
                    onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"; // Fallback
                    }}
                    alt="KEO Aerial View"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Content Section (Below Image, Corporate Style) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 w-full mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100">
                    <span className="block text-[#009CDE] font-bold tracking-widest uppercase mb-4 text-sm">Bem-estar Corporativo</span>
                    <h1 className="text-4xl md:text-6xl font-bold text-[#002D72] mb-6 leading-tight">
                        KEO ACTIVE
                    </h1>
                    <p className="text-xl text-gray-600 mb-10 max-w-3xl font-light leading-relaxed">
                        Estamos focados em influenciar positivamente o futuro da saúde das nossas comunidades.
                        A app KEO Active une as nossas equipas globais através do desporto, desafios e bem-estar.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <a href="#app" className="px-8 py-4 bg-[#009CDE] text-white text-lg rounded-full font-bold hover:bg-[#007bb5] transition shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                            <Download className="w-5 h-5" /> Descarregar App
                        </a>
                        <a href="#eventos" className="px-8 py-4 bg-white border-2 border-[#002D72] text-[#002D72] text-lg rounded-full font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer">
                            <Calendar className="w-5 h-5" /> Ver Eventos
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeroSection;
