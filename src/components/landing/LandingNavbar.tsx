import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingNavbar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { name: 'Missão', href: '#missao' },
        { name: 'Eventos', href: '#eventos' },
        { name: 'Galeria', href: '#galeria' },
    ];

    return (
        <nav className="w-full z-50 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-24">
                    {/* Left: Branding */}
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="bg-[#002D72] text-white px-3 py-1 rounded-[2px] shadow-sm">
                                <span className="text-2xl font-bold tracking-widest font-sans">KEO</span>
                            </div>
                            <span className="text-[#009CDE] text-xl font-light tracking-wider">ACTIVE</span>
                        </Link>
                    </div>

                    {/* Right: Nav Links, Actions & Official Logo */}
                    <div className="flex items-center">
                        {/* Desktop Menu Links */}
                        <div className="hidden md:flex space-x-8 items-center mr-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    className="text-gray-500 hover:text-[#002D72] text-sm font-bold uppercase tracking-wider transition"
                                >
                                    {link.name}
                                </a>
                            ))}
                        </div>

                        <Link
                            to="/login"
                            className="hidden md:inline-block text-[#002D72] border-2 border-[#002D72] px-6 py-2 rounded-full font-bold hover:bg-[#002D72] hover:text-white transition uppercase text-sm tracking-wide mr-8"
                        >
                            Login
                        </Link>
                        {/* Official Logo Right */}
                        {/* Official Logo Right - Hidden on Mobile */}
                        {/* Official Logo removed as per request */}
                    </div>

                    {/* Mobile menu button (Only visible on small screens) */}
                    <div className="md:hidden flex items-center absolute right-4">
                        <button onClick={toggleMenu} className="text-gray-600 hover:text-[#002D72] focus:outline-none">
                            {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
                        </button>
                    </div>
                </div>

            </div>

            {/* Mobile Menu */}
            {
                isOpen && (
                    <div className="md:hidden bg-white shadow-lg absolute w-full border-t border-gray-100">
                        <div className="flex flex-col py-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={toggleMenu}
                                    className="px-6 py-4 text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-[#002D72] uppercase tracking-wider border-b border-gray-50"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <div className="p-6">
                                <Link
                                    to="/login"
                                    onClick={toggleMenu}
                                    className="block text-center bg-[#002D72] text-white py-3 rounded-full font-bold uppercase tracking-wide text-sm"
                                >
                                    Login / Download App
                                </Link>
                            </div>
                        </div>
                    </div>
                )
            }
        </nav >
    );
};

export default LandingNavbar;
