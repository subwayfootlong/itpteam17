"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

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

    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await postJson('/api/auth/login', { email, password });
            toast.push({ type: 'success', message: 'Login successful' });
            if (onLoginSuccess) onLoginSuccess();
        } catch (err: unknown) {
            console.error(err);
            toast.push({ type: 'error', message: getErrorMessage(err, 'Login error') });
        }
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

                    {/* Email Inputs Entry Card (reusable Input) */}
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g., name@example.com"
                        iconLeft={(
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        )}
                        required
                    />

                    {/* Password Inputs Entry Card (reusable Input with toggle) */}
                    <Input
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        iconLeft={(
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        )}
                        showPasswordToggle
                        isPasswordVisible={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                        required
                    />

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
                        <Button type="submit" variant="primary">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                            </svg>
                            <span>Login</span>
                        </Button>

                        {/* Secondary Option Action Interface link */}
                        <Button type="button" variant="secondary" onClick={onCreateAccountClick}>
                            Create account
                        </Button>
                    </div>
                </form>

                {/* 5. Support Assistance Row Footer */}
                <div className="w-full pt-10 mt-6 border-t border-slate-200 flex flex-col items-center gap-3">
                    <span className="text-stone-600 text-sm font-normal">Need assistance?</span>
                                        <div className="w-full flex justify-center">
                                            <Button type="button" variant="ghost" fullWidth={false} onClick={onContactSupportClick} className="border-stone-200">
                                                <svg className="w-4 h-4 text-stone-700" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                                                </svg>
                                                <span>Contact Support</span>
                                            </Button>
                                        </div>
                </div>

            </div>
        </div>
    );
};

export default LoginScreen;
