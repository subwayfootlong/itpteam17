"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onBackToLogin?: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        alert(payload?.error || 'Registration failed');
        return;
      }

      if (onRegisterSuccess) onRegisterSuccess();
    } catch (error) {
      console.error(error);
      alert('Registration error');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white flex flex-col justify-start items-center p-6 z-[980] overflow-y-auto select-none">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-900 to-transparent" />

      <div className="w-full max-w-md flex flex-col justify-start items-center py-8 relative z-10 my-auto">
        
        {/* Header Segment */}
        <div className="w-full flex flex-col justify-start items-center pb-8 text-center">
          <div className="relative mb-4 w-24 h-28">
            <Image
              className="object-contain"
              src="/secondarylogo.png"
              alt="Pergas Logo"
              fill
              sizes="96px"
              priority
            />
          </div>
          <h2 className="text-gray-900 text-2xl font-semibold font-serif leading-8">Join the Community</h2>
          <p className="text-stone-600 text-sm md:text-base font-normal max-w-xs mt-2 leading-relaxed">
            Register today to access member<br />benefits, events, and resources.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {/* Full Name */}
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-gray-900 text-sm font-semibold tracking-tight">Full Name</label>
            <div className="w-full rounded-xl bg-slate-50 border border-stone-300 focus-within:border-[#53A63E] transition-all">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-12 px-4 bg-transparent text-gray-900 text-sm outline-none"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="w-full flex flex-col gap-1.5">
            <label className="text-gray-900 text-sm font-semibold tracking-tight">Email Address</label>
            <div className="w-full rounded-xl bg-slate-50 border border-stone-300 focus-within:border-[#53A63E] transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full h-12 px-4 bg-transparent text-gray-900 text-sm outline-none"
                required
              />
            </div>
          </div>

          {/* Password Fields (Shared Logic) */}
          {[
            { label: 'Password', val: password, set: setPassword },
            { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword }
          ].map((field, idx) => (
            <div key={idx} className="w-full flex flex-col gap-1.5">
              <label className="text-gray-900 text-sm font-semibold tracking-tight">{field.label}</label>
              <div className="relative w-full rounded-xl bg-slate-50 border border-stone-300 focus-within:border-[#53A63E] transition-all">
                <input
                  type={showPassword ? "text" : "password"}
                  value={field.val}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={idx === 0 ? "Create a password" : "Repeat your password"}
                  className="w-full h-12 px-4 pr-12 bg-transparent text-gray-900 text-sm outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
              </div>
            </div>
          ))}

          <button type="submit" className="w-full h-12 mt-4 bg-[#53A63E] text-white font-semibold rounded-xl hover:bg-opacity-95 transition-all">
            Create Account
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm">
          <span className="text-stone-600">Already have an account? </span>
          <button onClick={onBackToLogin} className="text-[#53A63E] font-semibold hover:underline">Sign in</button>
        </div>

        <p className="mt-8 text-xs text-center text-stone-400">
          By creating an account, you agree to the Pergas<br />
          <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;