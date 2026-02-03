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
                            alt="KEO Team Meeting"
                            className="rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition duration-500"
                        />
                    </div>
                    <div className="lg:w-1/2">
                        <h4 className="text-[#009CDE] font-bold uppercase tracking-widest mb-2 text-sm md:text-base">Our Culture</h4>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#002D72] mb-6">Innovation Beyond the Office</h2>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            At KEO, we design sustainable cities and shape the future. The <strong>KEO Active</strong> app is the extension of this philosophy to our health.
                        </p>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Whether you are in the Porto office, Lisbon, or on an international project, our platform connects you with colleagues through sports. Participate in leagues, step challenges, and mindfulness sessions.
                        </p>

                        <ul className="space-y-4">
                            <li className="flex items-center text-gray-700">
                                <span className="bg-blue-100 p-2 rounded-full mr-4 text-[#002D72]"><Users className="w-5 h-5" /></span>
                                Global Team Building
                            </li>
                            <li className="flex items-center text-gray-700">
                                <span className="bg-blue-100 p-2 rounded-full mr-4 text-[#002D72]"><Activity className="w-5 h-5" /></span>
                                Health Monitoring
                            </li>
                            <li className="flex items-center text-gray-700">
                                <span className="bg-blue-100 p-2 rounded-full mr-4 text-[#002D72]"><Award className="w-5 h-5" /></span>
                                Productivity & Wellness Rewards
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MissionSection;
