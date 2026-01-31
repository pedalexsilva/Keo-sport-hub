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
            navigate('/app');
        }
        setLoading(false);
    };

    const handleSignUp = async () => {
        // Client-side validation
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
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        KEO Sports Hub
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to access your dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <input
                                type="email"
                                required
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>
                    )}

                    {message && (
                        <div className="text-green-600 text-sm text-center bg-green-50 p-2 rounded">{message}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading || !email || !password}
                            className="mt-2 group relative flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
