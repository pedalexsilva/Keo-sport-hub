import React from 'react';
import { Users, Activity, Award } from 'lucide-react';

const MissionSection: React.FC = () => {
    return (
        <section id="missao" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:flex lg:items-center lg:gap-16">
                    <div className="lg:w-1/2 mb-10 lg:mb-0">
                        <img
                            src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                            alt="Equipa KEO em reunião"
                            className="rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition duration-500"
                        />
                    </div>
                    <div className="lg:w-1/2">
                        <h4 className="text-[#009CDE] font-bold uppercase tracking-widest mb-2 text-sm md:text-base">A Nossa Cultura</h4>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#002D72] mb-6">Inovação além do Escritório</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            Na KEO, desenhamos cidades sustentáveis e moldamos o futuro. A app <strong>KEO Active</strong> é a extensão dessa filosofia para a nossa saúde.
                        </p>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Quer estejas no escritório do Porto, em Lisboa ou num projeto internacional, a nossa plataforma conecta-te com colegas através do desporto. Participa em ligas, desafios de passos e sessões de mindfulness.
                        </p>

                        <ul className="space-y-4">
                            <li className="flex items-center text-gray-700">
                                <span className="bg-blue-100 p-2 rounded-full mr-4 text-[#002D72]"><Users className="w-5 h-5" /></span>
                                Team Building Global
                            </li>
                            <li className="flex items-center text-gray-700">
                                <span className="bg-blue-100 p-2 rounded-full mr-4 text-[#002D72]"><Activity className="w-5 h-5" /></span>
                                Monitorização de Saúde
                            </li>
                            <li className="flex items-center text-gray-700">
                                <span className="bg-blue-100 p-2 rounded-full mr-4 text-[#002D72]"><Award className="w-5 h-5" /></span>
                                Prémios de Produtividade & Bem-estar
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MissionSection;
