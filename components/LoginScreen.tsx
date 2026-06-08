"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface LoginScreenProps {
    onLoginSuccess?: () => void;
    onCreateAccountClick?: () => void;
    onForgotPasswordClick?: () => void;
    onContactSupportClick?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
    onLoginSuccess,
    onCreateAccountClick,
    onForgotPasswordClick,
    onContactSupportClick,
}) => {
    // Client state management for fields and interactions
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Enforcing the strict branding guidelines
    // Primary Logo Minimum authorized width is 85mm -> ~320px
    const LOGO_MIN_WIDTH = 320;
    const LOGO_HEIGHT = 64;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        (async () => {
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (res.ok) {
                    if (onLoginSuccess) onLoginSuccess();
                } else {
                    const body = await res.json();
                    alert(body?.error || 'Login failed');
                }
            } catch (err) {
                console.error(err);
                alert('Login error');
            }
        })();
    };

    return (
        // Responsive container shell: borderless and fluid on mobile viewports
        <div className="fixed inset-0 w-full h-full bg-white flex flex-col justify-start items-center p-6 z-[980] overflow-y-auto select-none">

            {/* Subtle brand radial background canvas mask */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-900 to-transparent" />

            <div className="w-full max-w-md flex flex-col justify-start items-center py-8 relative z-10 my-auto">

                {/* 1. Header Segment: Brand Identity & Subtitles */}
                <div className="w-full flex flex-col justify-start items-center pb-8 text-center">
                    <div className="relative mb-4" style={{ width: `${LOGO_MIN_WIDTH}px`, height: `${LOGO_HEIGHT}px` }}>
                        <Image
                            className="object-contain"
                            src="/primarylogo.png"
                            alt="Pergas Primary Corporate Logo"
                            fill
                            sizes="320px"
                            priority
                        />
                    </div>

                    <h2 className="text-[#53A63E] text-2xl font-semibold font-serif leading-8 pt-2">
                        Pergas
                    </h2>

                    <p className="text-stone-600 text-sm md:text-base font-normal max-w-xs mt-2 leading-relaxed">
                        Welcome back. Please sign in to<br />access your member benefits and events.
                    </p>
                </div>

                {/* 2. Form Input Fields Framework */}
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">

                    {/* Email Inputs Entry Card */}
                    <div className="w-full flex flex-col gap-1.5">
                        <label className="text-gray-900 text-sm font-semibold tracking-tight">
                            Email Address
                        </label>
                        <div className="relative w-full rounded-xl bg-slate-50 border border-stone-300 focus-within:border-[#53A63E] transition-all">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                {/* Mail Icon SVG */}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g., name@example.com"
                                className="w-full h-12 pl-12 pr-4 bg-transparent text-gray-900 text-sm font-normal placeholder-stone-400 outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Inputs Entry Card */}
                    <div className="w-full flex flex-col gap-1.5">
                        <label className="text-gray-900 text-sm font-semibold tracking-tight">
                            Password
                        </label>
                        <div className="relative w-full rounded-xl bg-slate-50 border border-stone-300 focus-within:border-[#53A63E] transition-all">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                                {/* Lock Icon SVG */}
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </span>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full h-12 pl-12 pr-12 bg-transparent text-gray-900 text-sm font-normal placeholder-stone-400 outline-none"
                                required
                            />
                            {/* Eye visibility toggler element */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 3. Auxiliary controls: Remember box + Recover option link */}
                    <div className="w-full flex items-center justify-between text-sm py-1">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-5 h-5 accent-[#53A63E] border-stone-300 rounded cursor-pointer"
                            />
                            <span className="text-stone-800 font-normal leading-tight">Remember me</span>
                        </label>

                        <button
                            type="button"
                            onClick={onForgotPasswordClick}
                            className="text-stone-700 hover:text-stone-900 font-semibold text-right transition-colors"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* 4. Action Access Controls Block */}
                    <div className="w-full flex flex-col gap-3 pt-2">
                        {/* Primary Secure Form Submitter */}
                        <button
                            type="submit"
                            className="w-full h-12 bg-[#53A63E] hover:bg-opacity-95 text-white font-semibold rounded-xl flex justify-center items-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span>Login</span>
                        </button>

                        {/* Secondary Option Action Interface link */}
                        <button
                            type="button"
                            onClick={onCreateAccountClick}
                            className="w-full h-12 bg-stone-50 hover:bg-stone-100 text-gray-900 font-semibold rounded-xl border border-stone-300/80 transition-all active:scale-[0.99]"
                        >
                            Create account
                        </button>
                    </div>
                </form>

                {/* 5. Support Assistance Row Footer */}
                <div className="w-full pt-10 mt-6 border-t border-slate-200 flex flex-col items-center gap-3">
                    <span className="text-stone-600 text-sm font-normal">Need assistance?</span>
                    <button
                        type="button"
                        onClick={onContactSupportClick}
                        className="flex items-center justify-center gap-2 px-5 py-2 rounded-full text-stone-800 font-semibold text-sm hover:bg-stone-50 border border-stone-200 transition-colors"
                    >
                        {/* Headphones / Support Tech Icon SVG */}
                        <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                        </svg>
                        <span>Contact Support</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LoginScreen;