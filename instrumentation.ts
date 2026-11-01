import type { Instrumentation } from "next";
import { logServerError } from "./lib/serverErrors";

export const onRequestError: Instrumentation.onRequestError = (error) => {
  // Do not forward request URLs, headers, user data or raw framework errors.
  logServerError("next.request", error);
};
