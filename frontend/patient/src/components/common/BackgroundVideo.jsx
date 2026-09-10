import React from 'react';
import { usePatient } from '../../context/PatientContext';

export const BackgroundVideo = () => {
  const { theme } = usePatient();
  const isLight = theme === 'light';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20 select-none">
      {/* 1. Ambient Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-20 pointer-events-none scale-105 transform opacity-90 transition-opacity duration-700"
        src="https://assets.mixkit.co/videos/preview/mixkit-medical-staff-walking-in-a-hospital-hallway-40916-large.mp4"
        poster="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1920"
      />

      {/* 2. Dynamic Backdrop Glass Overlay (-z-10) */}
      <div
        className={`absolute inset-0 -z-10 transition-colors duration-500 ${
          isLight
            ? 'bg-white/80 backdrop-blur-md'
            : 'bg-slate-950/75 backdrop-blur-sm'
        }`}
      />

      {/* 3. Ambient Medical Color Accents */}
      <div
        className={`absolute top-0 left-1/4 w-[600px] h-[350px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          isLight ? 'bg-cyan-500/10' : 'bg-cyan-600/15'
        }`}
      />
      <div
        className={`absolute bottom-0 right-1/4 w-[600px] h-[350px] rounded-full blur-[140px] pointer-events-none transition-all duration-700 ${
          isLight ? 'bg-teal-500/10' : 'bg-teal-600/15'
        }`}
      />

      {/* 4. Subtle Medical Cross / Tech Grid Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          isLight ? 'opacity-[0.02]' : 'opacity-[0.04]'
        }`}
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${isLight ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)'} 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />
    </div>
  );
};

export default BackgroundVideo;
