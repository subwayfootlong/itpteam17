"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export const MEMBER_FONT_SIZES = [
  "small",
  "default",
  "large",
  "extraLarge",
] as const;

export type MemberFontSize = (typeof MEMBER_FONT_SIZES)[number];

type MemberFontSizeContextValue = {
  fontSize: MemberFontSize;
  setFontSize: (value: MemberFontSize) => void;
};

const STORAGE_KEY = "pergas-member-font-size";
let cachedFontSize: MemberFontSize | null = null;

const MemberFontSizeContext = createContext<MemberFontSizeContextValue | null>(null);

function isValidFontSize(value: string | null): value is MemberFontSize {
  return MEMBER_FONT_SIZES.includes(value as MemberFontSize);
}

export function MemberFontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<MemberFontSize>(
    cachedFontSize ?? "default",
  );
  const isHydratedRef = useRef(false);

  useEffect(() => {
    isHydratedRef.current = true;

    if (cachedFontSize) {
      return;
    }

    try {
      const savedValue = window.localStorage.getItem(STORAGE_KEY);

      if (isValidFontSize(savedValue)) {
        cachedFontSize = savedValue;
        queueMicrotask(() => {
          setFontSizeState(savedValue);
        });
      }
    } catch (error) {
      console.error("Unable to load font-size preference:", error);
    }
  }, []);

  function setFontSize(value: MemberFontSize) {
    cachedFontSize = value;
    setFontSizeState(value);

    if (!isHydratedRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      console.error("Unable to save font-size preference:", error);
    }
  }

  return (
    <MemberFontSizeContext.Provider value={{ fontSize, setFontSize }}>
      <div
        className="member-font-scope"
        data-font-size={fontSize}
        suppressHydrationWarning
      >
        {children}
      </div>
    </MemberFontSizeContext.Provider>
  );
}

export function useMemberFontSize() {
  const context = useContext(MemberFontSizeContext);

  if (!context) {
    throw new Error("useMemberFontSize must be used inside MemberFontSizeProvider");
  }

  return context;
}
