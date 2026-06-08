"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

const SplashScreen = () => {
  // Use a state to ensure the spinner starts animating after the client mounts
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Your spinner SVG code
  const Spinner = () => (
    <svg
      className={`w-8 h-8 ${isClient ? 'animate-spin' : ''} text-[#53A63E] opacity-90`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    // This container forces a full-page white background and centering
    <div className="fixed inset-0 w-full h-full bg-white flex flex-col justify-between items-center p-6 z-[1000]">

      {/* 1. Top Section / Spacer (Matches the flex space-between structural gap) */}
      <div className="pt-10" />

      {/* 2. Center Content: Logo + Text + Spinner Stack */}
      <div className="flex flex-col items-center gap-6 flex-grow justify-center">
        {/* Main Pergas Logo with Text */}
        <div className="flex flex-col items-center gap-2">
          <Image
            className="w-32 h-36 object-contain" // w-32 is 128px (Well above the 56px minimum)
            src="/secondarylogo.png"            // Updated to your new file name
            alt="Pergas Secondary Logo"
            width={128}
            height={144}
            sizes="128px"
            priority
          />
          {/* Ensure this text is a single line, centered, and matches the logo width */}
          <p className="text-sm font-sans text-center whitespace-nowrap leading-tight text-gray-900 tracking-wide pt-1">
            Persatuan Ulama dan Guru-Guru Agama Islam (Singapura)
          </p>
        </div>

        {/* Animated Loading Spinner */}
        <Spinner />
      </div>

      {/* 3. Bottom Footer Text */}
      <div className="pb-8 text-center w-full">
        <p className="text-[10px] tracking-[0.15em] text-gray-400 font-semibold uppercase font-['Playfair_Display']">
          Established 1957 • Singapore
        </p>
      </div>

    </div>
  );
};

export default SplashScreen;