"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import WelcomeScreen from '@/components/WelcomeScreen';
import LoginScreen from '@/components/LoginScreen';
import RegisterScreen from '@/components/RegisterScreen';

export default function Home() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<'splash' | 'welcome' | 'login' | 'register'>('splash');

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
    window.alert('Login successful');
    console.log("User successfully validated. Authenticating and routing to Dashboard panel...");
    router.push('/member');
  };

  const handleRegisterSuccess = () => {
    window.alert('Account created');
    console.log('Account created successfully.');
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
          onCreateAccountClick={() => setCurrentScreen('register')}
          onForgotPasswordClick={() => console.log("Routing to password recovery interface...")}
          onContactSupportClick={() => console.log("Opening communication ticket modal...")}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen onRegisterSuccess={handleRegisterSuccess} onBackToLogin={() => setCurrentScreen('login')} />
      )}
    </main>
  );
}