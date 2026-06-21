"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentScreen, setCurrentScreen] = useState<
    "splash" | "welcome" | "login" | "register"
  >("splash");

  useEffect(() => {
    if (searchParams.get("screen") === "login") {
      setCurrentScreen("login");
      return;
    }

    const timer = setTimeout(() => {
      setCurrentScreen("welcome");
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const handleGetStarted = () => {
    setCurrentScreen("login");
  };

  const handleLoginSuccess = () => {
    router.push("/member");
  };

  const handleRegisterSuccess = () => {
    router.push("/member");
    router.refresh();
  };

  return (
    <main className="min-h-screen w-full relative bg-white">
      {currentScreen === "splash" && <SplashScreen />}

      {currentScreen === "welcome" && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}

      {currentScreen === "login" && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onCreateAccountClick={() => setCurrentScreen("register")}
          onForgotPasswordClick={() =>
            console.log("Routing to password recovery interface...")
          }
          onContactSupportClick={() =>
            console.log("Opening communication ticket modal...")
          }
        />
      )}

      {currentScreen === "register" && (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onBackToLogin={() => setCurrentScreen("login")}
        />
      )}
    </main>
  );
}