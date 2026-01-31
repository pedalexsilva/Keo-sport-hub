import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Activity, Users, Trophy } from 'lucide-react';
import Button from '../components/Button';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="font-sans text-gray-900 bg-white">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-black/90 backdrop-blur-md text-white border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold tracking-tighter">KEO<span className="text-[#E30613]">.</span></span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/login')} className="text-sm font-medium hover:text-gray-300 transition-colors">
                                Login
                            </button>
                            <Button onClick={() => navigate('/login')} className="bg-[#E30613] hover:bg-[#C20510] text-white border-none">
                                Começar Agora
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
                    <img
                        src="/assets/keo-hero.jpg"
                        alt="KEO Team"
                        className="w-full h-full object-cover opacity-90"
                    />
                </div>

                {/* Content */}
                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
                            UNLOCK YOUR <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">POTENTIAL</span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
                            Junte-se à comunidade KEO. Sincronize as suas atividades, conquiste o ranking e supere os seus limites com a tecnologia de ponta.
                        </p>
                        <div className="flex gap-4">
                            <Button onClick={() => navigate('/login')} className="px-8 py-4 text-lg bg-[#E30613] hover:bg-[#C20510] border-none text-white">
                                Juntar-se à Equipa <ChevronRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Mondrian Accents */}
                <div className="absolute bottom-0 left-0 w-full h-2 flex">
                    <div className="h-full w-1/3 bg-[#E30613]"></div> {/* Red */}
                    <div className="h-full w-1/3 bg-[#FFCC00]"></div> {/* Yellow */}
                    <div className="h-full w-1/3 bg-[#0055A4]"></div> {/* Blue */}
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-[#111] text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Performance. Dados. Comunidade.</h2>
                        <div className="w-20 h-1 bg-[#E30613] mx-auto"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-[#1A1A1A] border-t-4 border-[#0055A4] hover:transform hover:-translate-y-2 transition-all duration-300">
                            <div className="w-12 h-12 bg-[#0055A4]/20 rounded-lg flex items-center justify-center mb-6">
                                <Activity className="h-6 w-6 text-[#0055A4]" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Sync Strava</h3>
                            <p className="text-gray-400">
                                Integração automática com o Strava. Cada quilómetro conta para a sua pontuação global.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-[#1A1A1A] border-t-4 border-[#FFCC00] hover:transform hover:-translate-y-2 transition-all duration-300">
                            <div className="w-12 h-12 bg-[#FFCC00]/20 rounded-lg flex items-center justify-center mb-6">
                                <Trophy className="h-6 w-6 text-[#FFCC00]" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Leaderboards</h3>
                            <p className="text-gray-400">
                                Competição saudável em tempo real. Veja onde se posiciona contra os seus colegas.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-[#1A1A1A] border-t-4 border-[#E30613] hover:transform hover:-translate-y-2 transition-all duration-300">
                            <div className="w-12 h-12 bg-[#E30613]/20 rounded-lg flex items-center justify-center mb-6">
                                <Users className="h-6 w-6 text-[#E30613]" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Eventos Exclusivos</h3>
                            <p className="text-gray-400">
                                Participe em eventos organizados, corridas e desafios de equipa.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-black text-gray-500 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <span className="text-2xl font-bold tracking-tighter text-white block mb-4">KEO<span className="text-[#E30613]">.</span></span>
                    <p>&copy; 2026 KEO Sports Hub. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
