import React from 'react';
import { Play, Flame, Trophy } from 'lucide-react';

const AppShowcase: React.FC = () => {
    return (
        <section id="app" className="py-20 bg-[#002D72] text-white overflow-hidden relative">
            {/* Decorative Circle */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#009CDE] rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute -left-20 bottom-0 w-72 h-72 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="lg:flex items-center">
                    <div className="lg:w-1/2 mb-10 lg:mb-0">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">A tua saúde na palma da mão.</h2>
                        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                            Acede ao calendário de eventos da KEO, regista o teu progresso, ganha pontos e troca por benefícios exclusivos da empresa.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-900 transition border border-gray-700 cursor-pointer">
                                {/* Simple Apple Icon Svg */}
                                <svg viewBox="0 0 384 512" width="30" fill="currentColor">
                                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                                </svg>
                                <div className="text-left">
                                    <span className="block text-xs text-gray-400">Descarregar na</span>
                                    <span className="block text-lg font-bold leading-none">App Store</span>
                                </div>
                            </button>
                            <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-900 transition border border-gray-700 cursor-pointer">
                                <Play className="w-8 h-8 fill-current" />
                                <div className="text-left">
                                    <span className="block text-xs text-gray-400">DISPONÍVEL NO</span>
                                    <span className="block text-lg font-bold leading-none">Google Play</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-1/2 flex justify-center lg:justify-end">
                        {/* Mockup Phone CSS only */}
                        <div className="relative w-72 h-[550px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                            <div className="w-full h-full bg-white text-gray-800 overflow-y-auto no-scrollbar">
                                {/* Mock App UI */}
                                <div className="bg-[#002D72] p-6 text-white pt-12 rounded-b-3xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <p className="text-xs text-blue-200">Olá, Miguel</p>
                                            <h3 className="font-bold text-xl">KEO Active</h3>
                                        </div>
                                        <div className="w-10 h-10 bg-white rounded-full p-1">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Miguel" className="rounded-full" alt="User" />
                                        </div>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                                        <p className="text-xs text-blue-200 mb-1">Passos Hoje</p>
                                        <p className="text-3xl font-bold">8,432</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-4">
                                    <p className="font-bold text-gray-800">Próximo Desafio</p>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="bg-orange-100 p-3 rounded-lg text-orange-600"><Flame className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-bold text-sm">Semana de Corrida</p>
                                            <p className="text-xs text-gray-500">Faltam 2 dias</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="bg-green-100 p-3 rounded-lg text-green-600"><Trophy className="w-5 h-5" /></div>
                                        <div>
                                            <p className="font-bold text-sm">Torneio Padel</p>
                                            <p className="text-xs text-gray-500">Inscrições abertas</p>
                                        </div>
                                    </div>
                                    <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80" className="w-full h-32 object-cover rounded-xl mt-2" alt="Sport" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppShowcase;
