import type { InputHTMLAttributes } from "react";

type AuthInputProps = InputHTMLAttributes<HTMLInputElement>;

/** suppressHydrationWarning avoids mismatches from password/email browser extensions. */
export default function AuthInput(props: AuthInputProps) {
  return <input {...props} suppressHydrationWarning />;
}
