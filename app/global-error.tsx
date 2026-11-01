"use client";

import ErrorPage from "./error";
import "./globals.css";

export default function GlobalError({ unstable_retry }: { unstable_retry: () => void }) {
  return <html lang="en"><body><ErrorPage unstable_retry={unstable_retry} /></body></html>;
}
