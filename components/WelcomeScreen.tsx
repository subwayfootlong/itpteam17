"use client";

import React from 'react';
import Image from 'next/image';

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  return (
    // Replaced fixed phone boundaries with a viewport-wide structural container
    <div className="fixed inset-0 w-full h-full bg-white flex flex-col justify-between items-center p-6 z-[990] overflow-y-auto">

      {/* Subtle brand radial background accent from Figma */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-900 to-transparent" />

      {/* 1. Top/Center Section: Brand Logo & Typography */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center items-center py-12 relative z-10">
        <div className="w-full flex flex-col justify-start items-center">

          {/* Main Pergas Horizontal Identity Emblem */}
          <div className="relative w-[320px] h-[70px] mb-8 min-w-[320px]">
            <Image
              className="object-contain"
              src="/primarylogo.png" // Updated to your new file name
              alt="Pergas Primary Logo"
              fill
              sizes="320px"
              priority
            />
          </div>

          {/* Main Heading Text */}
          <div className="flex flex-col gap-4 mt-4 text-center">
            <h1 className="text-gray-900 text-3xl font-bold font-serif leading-tight tracking-tight">
              Welcome to Pergas
            </h1>

            {/* Subtitle Body Description */}
            <p className="text-stone-700 text-base md:text-lg font-normal max-w-sm mx-auto leading-relaxed">
              Your community, events, and<br />membership in one place.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Bottom Action Container & Legal attribution */}
      <div className="w-full max-w-xs flex flex-col justify-end items-center pb-6 mt-auto relative z-10">

        {/* Interactive "Get Started" Primary Button */}
        <button
          onClick={onGetStarted}
          className="w-full h-12 bg-[#53A63E] hover:bg-opacity-95 text-white font-semibold rounded-xl shadow-md flex justify-center items-center gap-2 transition-all active:scale-[0.99]"
        >
          <span>Get Started</span>
          {/* Arrow SVG Icon matching Figma design spec */}
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>

        {/* Footer Institutional Labeling */}
        <div className="pt-8 flex flex-col justify-start items-center w-full">
          <div className="flex justify-center items-center gap-2 w-full">
            <div className="w-8 h-px bg-stone-300" />
            <span className="text-stone-500/80 text-[10px] font-bold tracking-wider uppercase">
              POWERED BY PERGAS
            </span>
            <div className="w-8 h-px bg-stone-300" />
          </div>

          {/* Detailed Regulatory / Copyright Statement */}
          <p className="pt-2 text-stone-400 text-[9px] font-normal text-center leading-normal max-w-[280px]">
            © 2026 Singapore Islamic Scholars &amp; Religious Teachers Association
          </p>
        </div>

      </div>
    </div>
  );
};

export default WelcomeScreen;