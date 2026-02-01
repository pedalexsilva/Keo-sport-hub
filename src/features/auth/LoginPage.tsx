import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message === 'Invalid login credentials') {
                setError('Email ou palavra-passe incorretos.');
            } else {
                setError(error.message);
            }
        } else {
            // Check for admin email
            if (email === 'admin@keo.com') {
                navigate('/admin');
            } else {
                navigate('/app');
            }
        }
        setLoading(false);
    };

    const handleSignUp = async () => {
        // Client-side validation
        if (!email || !password) {
            setError("Por favor preencha email e palavra-passe.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        setError(null);
        setMessage(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            // Setup metadata for the profile trigger (will use defaults if empty, but good practice)
            options: {
                data: {
                    full_name: email.split('@')[0], // Default name from email
                }
            }
        });

        if (error) {
            setError(error.message);
        } else if (data.session) {
            navigate('/app');
        } else {
            // Try explicit sign in if no session returned immediately
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!signInError) {
                navigate('/app');
            } else {
                setMessage('Account created! Please sign in.');
            }
        }
        setLoading(false);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 animate-fade-in">
                <div className="flex flex-col items-center mb-10">
                    {/* Brand Logo - Box Style */}
                    <div className="flex justify-center items-center gap-2 mb-2">
                        <div className="bg-[#002D72] text-white px-3 py-1 rounded-[2px] shadow-sm">
                            <span className="text-3xl font-bold tracking-widest font-sans">KEO</span>
                        </div>
                        <span className="text-[#009CDE] text-2xl font-light tracking-wider">ACTIVE</span>
                    </div>
                    <p className="mt-4 text-center text-sm text-gray-500 font-medium">
                        Bem-vindo ao teu hub de bem-estar
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 ml-1">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="block w-full rounded-xl border-gray-200 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#009CDE] focus:border-[#009CDE] sm:text-sm sm:leading-6 px-4 bg-gray-50 transition-all"
                                placeholder="exemplo@keo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 ml-1">
                                Palavra-passe
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="block w-full rounded-xl border-gray-200 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#009CDE] focus:border-[#009CDE] sm:text-sm sm:leading-6 px-4 bg-gray-50 transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                            {message}
                        </div>
                    )}

                    <div className="space-y-4 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-full bg-[#002D72] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#00235b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002D72] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    A entrar...
                                </span>
                            ) : 'Entrar'}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-2 text-xs text-gray-400 uppercase tracking-widest">Ou</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-full bg-white px-4 py-3.5 text-sm font-bold text-[#002D72] ring-2 ring-inset ring-[#002D72] hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#002D72] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Criar Conta Nova
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
