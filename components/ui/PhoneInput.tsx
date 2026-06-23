"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { getCountries, getCountryCallingCode } from "react-phone-number-input/input";
import en from "react-phone-number-input/locale/en.json";
import flags from "react-phone-number-input/flags";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { Country } from "react-phone-number-input";
import { digitsOnly } from "@/lib/phone";

const fieldBubble =
  "relative rounded-xl bg-slate-50 border border-stone-300 focus-within:border-[#53A63E] transition-all";

interface PhoneInputFieldProps {
  label?: string;
  id?: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  required?: boolean;
  placeholder?: string;
  defaultCountry?: Country;
}

const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  label,
  id,
  value,
  onChange,
  required,
  placeholder = "12345678",
  defaultCountry = "SG",
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [national, setNational] = useState("");

  const countryOptions = useMemo(() => getCountries(), []);

  useEffect(() => {
    if (!value) {
      setNational("");
      setCountry(defaultCountry);
      return;
    }

    const parsed = parsePhoneNumberFromString(value);
    if (!parsed) return;

    setCountry((parsed.country ?? defaultCountry) as Country);
    setNational(parsed.nationalNumber);
  }, [value, defaultCountry]);

  const emitChange = (nextCountry: Country, nextNational: string) => {
    setCountry(nextCountry);
    setNational(nextNational);

    const digits = digitsOnly(nextNational);
    if (!digits) {
      onChange(undefined);
      return;
    }

    onChange(`+${getCountryCallingCode(nextCountry)}${digits}`);
  };

  const Flag = flags[country];
  const callingCode = getCountryCallingCode(country);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-gray-900 text-sm font-semibold tracking-tight">
          {label}
        </label>
      ) : null}

      <div className="flex gap-2 w-full">
        <div className={`${fieldBubble} shrink-0 w-[7.75rem]`}>
          <div className="relative flex items-center h-12 px-3 gap-1.5">
            {Flag ? (
              <span
                className="flex shrink-0 w-[1.35rem] h-[0.95rem] overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.08)] [&>svg]:w-full [&>svg]:h-full"
                aria-hidden
              >
                <Flag title={en[country] ?? country} />
              </span>
            ) : null}
            <span className="text-sm font-normal text-gray-900 tabular-nums">+{callingCode}</span>
            <svg
              className="w-3.5 h-3.5 text-stone-500 shrink-0 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <select
              value={country}
              onChange={(e) => emitChange(e.target.value as Country, national)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Country code"
            >
              {countryOptions.map((option) => (
                <option key={option} value={option}>
                  {en[option]} (+{getCountryCallingCode(option)})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`${fieldBubble} flex-1 min-w-0`}>
          <input
            id={inputId}
            type="tel"
            inputMode="numeric"
            value={national}
            onChange={(e) => emitChange(country, digitsOnly(e.target.value))}
            placeholder={placeholder}
            required={required}
            className="w-full h-12 px-4 bg-transparent text-gray-900 text-sm font-normal placeholder-stone-400 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default PhoneInputField;
