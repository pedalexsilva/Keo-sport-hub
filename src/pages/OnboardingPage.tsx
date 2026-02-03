
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, MapPin, Briefcase, User, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../features/auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const OFFICES = [
    'Porto Office',
    'Lisboa Office',
    'Dubai Office',
    'Madrid Office',
    'Paris Office',
    'Berlin Office'
];

export default function OnboardingPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        role: '',
        office: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.name,
                    role: formData.role,
                    office: formData.office,
                    onboarding_completed: true
                })
                .eq('id', user.id);

            if (error) throw error;

            // Invalidate profile query to refetch new data
            await queryClient.invalidateQueries({ queryKey: ['profile'] });

            setStep(2);
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        navigate('/app/home');
    };

    return (
        <div className="min-h-screen bg-[#002D72] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-8">
                    <div className={`w-8 h-1 rounded-full ${step === 1 ? 'bg-[#009CDE]' : 'bg-white/20'}`} />
                    <div className={`w-8 h-1 rounded-full ${step === 2 ? 'bg-[#009CDE]' : 'bg-white/20'}`} />
                </div>

                {step === 1 ? (
                    <div className="animate-fade-in space-y-6">
                        <div className="text-center text-white mb-8">
                            <h1 className="text-2xl font-bold mb-2">Welcome to KEO!</h1>
                            <p className="text-white/70">Let's set up your athlete profile.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">
                                    What is your name?
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Your name"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#009CDE] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">
                                    What is your role?
                                </label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                                        placeholder="Ex: Civil Engineer"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#009CDE] transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">
                                    Where do you work?
                                </label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                                    <select
                                        required
                                        value={formData.office}
                                        onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value }))}
                                        className="w-full bg-white/10 border border-white/20 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-[#009CDE] transition-colors appearance-none [&>option]:text-gray-900"
                                    >
                                        <option value="" disabled>Select your office</option>
                                        {OFFICES.map(office => (
                                            <option key={office} value={office}>{office}</option>
                                        ))}
                                    </select>
                                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 rotate-90" />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#009CDE] hover:bg-[#008bc5] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#009CDE]/20 flex items-center justify-center gap-2 mt-8 transition-all active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Continue <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="animate-fade-in text-center space-y-6">
                        <div className="flex justify-center mb-8">
                            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/30 animate-scale-in">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        <div className="text-white mb-8">
                            <h1 className="text-3xl font-bold mb-2">All set!</h1>
                            <p className="text-white/70">
                                Your profile has been created. You are ready to start earning points.
                            </p>
                        </div>

                        {/* Profile Summary Card */}
                        <div className="bg-white/10 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold text-white mb-1">{formData.name}</h3>
                            <div className="flex items-center justify-center gap-2 text-white/60 text-sm">
                                <span>{formData.role}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {formData.office}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full bg-[#009CDE] hover:bg-[#008bc5] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#009CDE]/20 flex items-center justify-center gap-2 mt-8 transition-all active:scale-[0.98]"
                        >
                            Start Now <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
