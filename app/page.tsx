"use client";

import React, { useState, useEffect } from 'react';
import SplashScreen from '@/components/SplashScreen';
import WelcomeScreen from '@/components/WelcomeScreen';
import LoginScreen from '@/components/LoginScreen';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'welcome' | 'login'>('splash');

  useEffect(() => {
    // Phase 1: Splash Screen timer automatically forwards to Welcome page after 3s
    const timer = setTimeout(() => {
      setCurrentScreen('welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Action handlers
  const handleGetStarted = () => {
    setCurrentScreen('login');
  };

  const handleLoginSuccess = () => {
    console.log("User successfully validated. Authenticating and routing to Dashboard panel...");
    // Future step: router.push('/dashboard')
  };

  return (
    <main className="min-h-screen w-full relative bg-white">
      {currentScreen === 'splash' && <SplashScreen />}
      
      {currentScreen === 'welcome' && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}
      
      {currentScreen === 'login' && (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          onCreateAccountClick={() => console.log("Routing to signup wizard...")}
          onForgotPasswordClick={() => console.log("Routing to password recovery interface...")}
          onContactSupportClick={() => console.log("Opening communication ticket modal...")}
        />
      )}
    </main>
  );
}