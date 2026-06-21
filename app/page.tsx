"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";

export default function Home() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentScreen, setCurrentScreen] = useState<
    "splash" | "welcome" | "login" | "register"
  >("splash");
  const forcedScreen = searchParams.get("screen");
  const visibleScreen = forcedScreen === "login" ? "login" : currentScreen;

  useEffect(() => {
    if (forcedScreen === "login") {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentScreen("welcome");
    }, 3000);

    return () => clearTimeout(timer);
  }, [forcedScreen]);

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
      {visibleScreen === "splash" && <SplashScreen />}

      {visibleScreen === "welcome" && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}

      {visibleScreen === "login" && (
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

      {visibleScreen === "register" && (
        <RegisterScreen
          onRegisterSuccess={handleRegisterSuccess}
          onBackToLogin={() => setCurrentScreen("login")}
        />
      )}
    </main>
  );
}
