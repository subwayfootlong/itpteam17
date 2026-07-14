"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SplashScreen from "@/components/SplashScreen";
import WelcomeScreen from "@/components/WelcomeScreen";
import LoginScreen from "@/components/LoginScreen";
import RegisterScreen from "@/components/RegisterScreen";
import { LOGOUT_LOGIN_HINT_KEY } from "@/lib/session";

export default function Home() {
  return <HomeContent />;
}

function HomeContent() {
  const router = useRouter();

  const [currentScreen, setCurrentScreen] = useState<
    "splash" | "welcome" | "login" | "register"
  >(() => {
    if (typeof window !== "undefined") {
      const loginHint = window.sessionStorage.getItem(LOGOUT_LOGIN_HINT_KEY);

      if (loginHint === "1") {
        return "login";
      }
    }

    return "splash";
  });
  const [hasMounted, setHasMounted] = useState(false);
  const visibleScreen = currentScreen;

  useEffect(() => {
    setHasMounted(true);

    if (typeof window !== "undefined" && currentScreen === "login") {
      window.sessionStorage.removeItem(LOGOUT_LOGIN_HINT_KEY);
    }

    if (currentScreen !== "splash") {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentScreen("welcome");
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentScreen]);

  const handleGetStarted = () => {
    setCurrentScreen("login");
  };

  const handleCreateAccount = () => {
    setCurrentScreen("register");
  };

  const handleBackToLogin = () => {
    setCurrentScreen("login");
  };

  const handleLoginSuccess = () => {
    router.push("/member");
  };

  const handleRegisterSuccess = () => {
    router.push("/member");
    router.refresh();
  };

  if (!hasMounted) {
    return (
      <main className="min-h-screen w-full relative bg-white">
        <SplashScreen />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full relative bg-white">
      {visibleScreen === "splash" && <SplashScreen />}

      {visibleScreen === "welcome" && (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}

      {visibleScreen === "login" && (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onCreateAccountClick={handleCreateAccount}
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
          onBackToLogin={handleBackToLogin}
        />
      )}
    </main>
  );
}
