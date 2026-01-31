import React from 'react';

const StatsSection: React.FC = () => {
    return (
        <section className="py-12 bg-white shadow-md relative z-20 -mt-10 rounded-t-3xl mx-4 md:mx-10 lg:mx-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-100">
                    <div className="p-4">
                        <span className="block text-4xl font-bold text-[#002D72]">12</span>
                        <span className="text-gray-500 text-sm uppercase tracking-wide">Escritórios Globais</span>
                    </div>
                    <div className="p-4">
                        <span className="block text-4xl font-bold text-[#002D72]">50+</span>
                        <span className="text-gray-500 text-sm uppercase tracking-wide">Modalidades</span>
                    </div>
                    <div className="p-4">
                        <span className="block text-4xl font-bold text-[#002D72]">1.2k</span>
                        <span className="text-gray-500 text-sm uppercase tracking-wide">Colaboradores Ativos</span>
                    </div>
                    <div className="p-4">
                        <span className="block text-4xl font-bold text-[#002D72]">24/7</span>
                        <span className="text-gray-500 text-sm uppercase tracking-wide">Bem-estar</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
