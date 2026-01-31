import React from 'react';
import { ArrowRight } from 'lucide-react';

const UpcomingEvents: React.FC = () => {
    return (
        <section id="eventos" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-[#002D72] mb-4">Próximos Eventos</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">Inscreve-te através da App e garante o teu lugar nas atividades exclusivas para colaboradores KEO.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Event 1 */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition duration-300 group">
                        <div className="relative h-48 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Running" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            <div className="absolute top-4 right-4 bg-[#009CDE] text-white font-bold py-1 px-3 rounded-lg text-sm">
                                15 MAR
                            </div>
                        </div>
                        <div className="p-6">
                            <span className="text-xs font-bold text-gray-400 uppercase">Porto, Parque da Cidade</span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">KEO Run 10K</h3>
                            <p className="text-gray-600 text-sm mb-4">A corrida anual da KEO Portugal. Prepara-te para desafiar os teus limites com a equipa de engenharia.</p>
                            <a href="#" className="inline-flex items-center text-[#002D72] font-semibold hover:text-[#009CDE]">
                                Ver detalhes <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Event 2 */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition duration-300 group">
                        <div className="relative h-48 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Football" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            <div className="absolute top-4 right-4 bg-[#009CDE] text-white font-bold py-1 px-3 rounded-lg text-sm">
                                22 MAR
                            </div>
                        </div>
                        <div className="p-6">
                            <span className="text-xs font-bold text-gray-400 uppercase">Lisboa, Estádio Universitário</span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Inter-Office Football Cup</h3>
                            <p className="text-gray-600 text-sm mb-4">O clássico torneio entre os escritórios de Lisboa e Porto. Quem levará a taça este ano?</p>
                            <a href="#" className="inline-flex items-center text-[#002D72] font-semibold hover:text-[#009CDE]">
                                Ver detalhes <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Event 3 */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition duration-300 group">
                        <div className="relative h-48 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1544367563-12123d8965cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Yoga" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                            <div className="absolute top-4 right-4 bg-[#009CDE] text-white font-bold py-1 px-3 rounded-lg text-sm">
                                SEMPRE ÀS 4ªs
                            </div>
                        </div>
                        <div className="p-6">
                            <span className="text-xs font-bold text-gray-400 uppercase">Online / Presencial</span>
                            <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">Mindfulness & Yoga</h3>
                            <p className="text-gray-600 text-sm mb-4">Sessões semanais para descomprimir e melhorar o foco. Abertas a todos os departamentos.</p>
                            <a href="#" className="inline-flex items-center text-[#002D72] font-semibold hover:text-[#009CDE]">
                                Ver detalhes <ArrowRight className="ml-2 w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default UpcomingEvents;
