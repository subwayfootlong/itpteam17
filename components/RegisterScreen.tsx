"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { postJson } from '@/lib/api';
import PhoneInputField from '@/components/ui/PhoneInput';
import { getErrorMessage } from '@/lib/errors';
import { ARS_STATUSES, SALUTATIONS } from '@/lib/memberProfileOptions';

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onBackToLogin?: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [arsStatus, setArsStatus] = useState('no');
  const [phone, setPhone] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.push({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    if (!phone) {
      toast.push({ type: 'error', message: 'Please enter a valid telephone number' });
      return;
    }

    try {
      await postJson('/api/auth/register', {
        salutation,
        firstName,
        lastName,
        email,
        organization,
        designation,
        arsStatus,
        phone,
        password,
      });
      toast.push({ type: 'success', message: 'Account created' });
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (error: unknown) {
      console.error(error);
      toast.push({ type: 'error', message: getErrorMessage(error, 'Registration error') });
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white flex flex-col justify-start items-center p-6 z-[980] overflow-y-auto select-none">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-900 to-transparent" />

      <div className="w-full max-w-md flex flex-col justify-start items-center py-8 relative z-10 my-auto">
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

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <Select
            label="Salutation"
            value={salutation}
            onChange={(e) => setSalutation(e.target.value)}
            options={SALUTATIONS}
            placeholder="Select salutation"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="First Name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              required
            />
            <Input
              label="Last Name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              required
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            required
          />

          <Input
            label="Organization"
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Your organization or institution"
            required
          />

          <Input
            label="Designation"
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Your role or title"
            required
          />

          <Select
            label="Asatizah Recognition Scheme (ARS) Status"
            value={arsStatus}
            onChange={(e) => setArsStatus(e.target.value)}
            options={ARS_STATUSES}
            required
          />

          <PhoneInputField
            label="Telephone No."
            id="register-telephone"
            value={phone}
            onChange={setPhone}
            defaultCountry="SG"
            required
          />

          {[
            { label: 'Password', val: password, set: setPassword, placeholder: 'Create a password' },
            { label: 'Confirm Password', val: confirmPassword, set: setConfirmPassword, placeholder: 'Repeat your password' },
          ].map((field, idx) => (
            <Input
              key={idx}
              label={field.label}
              type={showPassword ? 'text' : 'password'}
              value={field.val}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              showPasswordToggle
              isPasswordVisible={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
              required
            />
          ))}

          <Button type="submit" className="mt-4" variant="primary">
            Create Account
          </Button>
        </form>

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
