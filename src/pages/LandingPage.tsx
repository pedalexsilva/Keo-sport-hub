import React from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import StatsSection from '../components/landing/StatsSection';
import MissionSection from '../components/landing/MissionSection';
import UpcomingEvents from '../components/landing/UpcomingEvents';

import GallerySection from '../components/landing/GallerySection';
import LandingFooter from '../components/landing/LandingFooter';

const LandingPage: React.FC = () => {
    return (
        <div className="font-sans text-gray-800 bg-white">
            <LandingNavbar />
            <HeroSection />
            <StatsSection />
            <MissionSection />
            <UpcomingEvents />

            <GallerySection />
            <LandingFooter />
        </div>
    );
};

export default LandingPage;
