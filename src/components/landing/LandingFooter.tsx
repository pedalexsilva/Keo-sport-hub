import React from 'react';
import { Linkedin, Instagram, Twitter } from 'lucide-react';

const LandingFooter: React.FC = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="text-2xl font-bold text-white mb-4">KEO <span className="text-[#009CDE]">ACTIVE</span></h3>
                    <p className="text-sm max-w-sm mb-6">
                        A plataforma oficial de bem-estar para os colaboradores da KEO International Consultants em Portugal e no mundo.
                    </p>
                    <div className="flex space-x-4">
                        <a href="#" className="hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-white transition"><Instagram className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-white transition"><Twitter className="w-5 h-5" /></a>
                    </div>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Links Rápidos</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-[#009CDE] transition">Portal do Colaborador</a></li>
                        <li><a href="#" className="hover:text-[#009CDE] transition">Suporte Técnico</a></li>
                        <li><a href="#" className="hover:text-[#009CDE] transition">Política de Privacidade</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Contacto</h4>
                    <ul className="space-y-2 text-sm">
                        <li>KEO Porto Office</li>
                        <li>Praça da Trindade, 142</li>
                        <li>Porto, Portugal</li>
                        <li className="mt-4"><a href="mailto:sports@keo.com" className="text-[#009CDE]">sports@keo.com</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs text-gray-500">
                &copy; {new Date().getFullYear()} KEO International Consultants. Todos os direitos reservados.
            </div>
        </footer>
    );
};

export default LandingFooter;
