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
import { ARS_CERTIFIED_STATUSES, SALUTATIONS } from '@/lib/memberProfileOptions';

interface RegisterScreenProps {
  onRegisterSuccess?: () => void;
  onBackToLogin?: () => void;
}

const STEPS = [
  { label: 'Personal', title: 'Tell us about yourself' },
  { label: 'Professional', title: 'Your work details' },
  { label: 'Account', title: 'Create your login' },
] as const;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [salutation, setSalutation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [isArsCertified, setIsArsCertified] = useState<boolean | null>(null);
  const [arsStatus, setArsStatus] = useState('');
  const [phone, setPhone] = useState<string | undefined>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toast = useToast();

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!salutation) {
        toast.push({ type: 'error', message: 'Please select a salutation' });
        return false;
      }
      if (!firstName.trim()) {
        toast.push({ type: 'error', message: 'Please enter your first name' });
        return false;
      }
    }

    if (currentStep === 2) {
      if (!organization.trim()) {
        toast.push({ type: 'error', message: 'Please enter your organization' });
        return false;
      }
      if (!designation.trim()) {
        toast.push({ type: 'error', message: 'Please enter your designation' });
        return false;
      }
      if (isArsCertified === null) {
        toast.push({ type: 'error', message: 'Please indicate whether you are ARS certified' });
        return false;
      }
      if (isArsCertified && !['pending', 'active'].includes(arsStatus)) {
        toast.push({ type: 'error', message: 'Please select your ARS status' });
        return false;
      }
    }

    if (currentStep === 3) {
      if (!email.trim()) {
        toast.push({ type: 'error', message: 'Please enter your email address' });
        return false;
      }
      if (!phone) {
        toast.push({ type: 'error', message: 'Please enter a valid telephone number' });
        return false;
      }
      if (!password) {
        toast.push({ type: 'error', message: 'Please create a password' });
        return false;
      }
      if (password !== confirmPassword) {
        toast.push({ type: 'error', message: 'Passwords do not match' });
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter' || step >= STEPS.length) return;
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    handleNext();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < STEPS.length) {
      handleNext();
      return;
    }

    if (!validateStep(3)) return;

    setSubmitting(true);
    try {
      await postJson('/api/auth/register', {
        salutation,
        firstName,
        lastName,
        arabicName,
        email,
        organization,
        designation,
        arsStatus: isArsCertified ? arsStatus : 'no',
        phone,
        password,
      });
      toast.push({ type: 'success', message: 'Account created' });
      if (onRegisterSuccess) onRegisterSuccess();
    } catch (error: unknown) {
      console.error(error);
      toast.push({ type: 'error', message: getErrorMessage(error, 'Registration error') });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white flex flex-col justify-start items-center p-6 z-[980] overflow-y-auto select-none">
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-900 to-transparent" />

      <div className="w-full max-w-md flex flex-col justify-start items-center py-8 relative z-10 my-auto">
        <div className="w-full flex flex-col justify-start items-center pb-6 text-center">
          <div className="relative mb-4 w-24 h-28">
            <Image
              className="object-contain"
              src="/pergas-logo.png"
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

        {/* Step progress indicator */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const stepNum = idx + 1;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;

              return (
                <React.Fragment key={s.label}>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        isActive
                          ? 'bg-[#53A63E] text-white shadow-md shadow-lime-200 scale-110'
                          : isComplete
                            ? 'bg-[#53A63E]/15 text-[#53A63E] border-2 border-[#53A63E]'
                            : 'bg-stone-100 text-stone-400 border-2 border-stone-200'
                      }`}
                    >
                      {isComplete ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : (
                        stepNum
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        isActive ? 'text-[#53A63E]' : isComplete ? 'text-stone-600' : 'text-stone-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300 ${
                        step > stepNum ? 'bg-[#53A63E]' : 'bg-stone-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} noValidate className="w-full flex flex-col gap-5">
          <div className="w-full overflow-hidden">
            <div
              className="flex w-full transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
            >
              <div
                className="min-w-full w-full flex-shrink-0 flex flex-col gap-5"
                aria-hidden={step !== 1}
                inert={step !== 1 ? true : undefined}
              >
                <div>
                  <p className="text-xs font-medium text-[#53A63E] uppercase tracking-wider">
                    Step 1 of {STEPS.length}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">{STEPS[0].title}</h3>
                </div>

                <Select
                  label="Salutation"
                  value={salutation}
                  onChange={(e) => setSalutation(e.target.value)}
                  options={SALUTATIONS}
                  placeholder="Select salutation"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="First Name"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                  />
                  <Input
                    label="Last Name (optional)"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>

                <Input
                  label="Arabic Name (optional)"
                  type="text"
                  value={arabicName}
                  onChange={(e) => setArabicName(e.target.value)}
                  placeholder="أحمد بن علي"
                  dir="rtl"
                />
              </div>

              <div
                className="min-w-full w-full flex-shrink-0 flex flex-col gap-5"
                aria-hidden={step !== 2}
                inert={step !== 2 ? true : undefined}
              >
                <div>
                  <p className="text-xs font-medium text-[#53A63E] uppercase tracking-wider">
                    Step 2 of {STEPS.length}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">{STEPS[1].title}</h3>
                </div>

                <Input
                  label="Organization"
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Your organization or institution"
                />

                <Input
                  label="Designation"
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="Your role or title"
                />

                <fieldset className="w-full flex flex-col gap-1.5 border-0 p-0 m-0">
                  <legend className="text-gray-900 text-sm font-semibold tracking-tight">
                    Are you Asatizah Recognition Scheme (ARS) certified?
                  </legend>
                  <div
                    className="flex w-full p-1 rounded-xl border border-stone-300 bg-slate-50"
                    role="radiogroup"
                    aria-label="Are you Asatizah Recognition Scheme (ARS) certified?"
                  >
                    {[
                      { label: 'Yes', value: 'yes' as const },
                      { label: 'No', value: 'no' as const },
                    ].map((option) => {
                      const isSelected =
                        option.value === 'yes' ? isArsCertified === true : isArsCertified === false;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => {
                            const certified = option.value === 'yes';
                            setIsArsCertified(certified);
                            if (certified) {
                              setArsStatus('');
                            } else {
                              setArsStatus('no');
                            }
                          }}
                          className={`flex-1 h-10 rounded-lg text-sm transition-all ${
                            isSelected
                              ? 'bg-white text-[#318b22] font-semibold shadow-sm ring-1 ring-[#53A63E]/20'
                              : 'text-stone-600 font-medium hover:text-stone-900'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {isArsCertified && (
                  <Select
                    label="ARS Status"
                    value={arsStatus}
                    onChange={(e) => setArsStatus(e.target.value)}
                    options={ARS_CERTIFIED_STATUSES}
                    placeholder="Select your ARS status"
                  />
                )}
              </div>

              <div
                className="min-w-full w-full flex-shrink-0 flex flex-col gap-5"
                aria-hidden={step !== 3}
                inert={step !== 3 ? true : undefined}
              >
                <div>
                  <p className="text-xs font-medium text-[#53A63E] uppercase tracking-wider">
                    Step 3 of {STEPS.length}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">{STEPS[2].title}</h3>
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />

                <PhoneInputField
                  label="Telephone No."
                  id="register-telephone"
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="SG"
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
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}

            {step < STEPS.length ? (
              <Button type="button" variant="primary" onClick={handleNext} className={step === 1 ? 'w-full' : 'flex-1'}>
                Next
              </Button>
            ) : (
              <Button type="submit" variant="primary" loading={submitting} className="flex-1">
                Complete Registration
              </Button>
            )}
          </div>
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
