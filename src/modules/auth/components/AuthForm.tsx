"use client";

import Link from "next/link";
import { useActionState } from "react";
import { logIn, signUp } from "../actions";
import type { FormState } from "../types";

const input = "w-full min-h-14 rounded-xl border-2 border-[#12263F] bg-white px-4 text-lg text-[#12263F]";
const label = "mb-1 block text-base font-semibold";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [state, formAction, pending] = useActionState<FormState, FormData>(isSignup ? signUp : logIn, {});

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-3xl font-bold">
        {isSignup ? "Create account" : "Log in"}
        <span className="block text-xl font-normal text-[#41546B]">{isSignup ? "ಖಾತೆ ತೆರೆಯಿರಿ" : "ಲಾಗಿನ್"}</span>
      </h1>

      {isSignup && (
        <div>
          <label htmlFor="full_name" className={label}>Name · ಹೆಸರು</label>
          <input id="full_name" name="full_name" autoComplete="name" required className={input} />
        </div>
      )}
      <div>
        <label htmlFor="email" className={label}>Email · ಇಮೇಲ್</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={input} />
      </div>
      <div>
        <label htmlFor="password" className={label}>Password · ಪಾಸ್ವರ್ಡ್</label>
        <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} required minLength={6} className={input} />
      </div>

      {isSignup && (
        <fieldset className="flex flex-col gap-2">
          <legend className={label}>I am a · ನಾನು</legend>
          <label className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-[#12263F] bg-white px-4 text-lg">
            <input type="radio" name="role" value="worker" defaultChecked className="h-5 w-5" /> Worker · ಕಾರ್ಮಿಕ
          </label>
          <label className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-[#12263F] bg-white px-4 text-lg">
            <input type="radio" name="role" value="helper" className="h-5 w-5" /> Helper · ಸಹಾಯಕ
          </label>
        </fieldset>
      )}

      {state.error && (
        <p role="alert" className="rounded-xl bg-[#FBE9E7] p-3 text-base font-semibold text-[#B3261E]">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="min-h-14 rounded-xl bg-[#12263F] text-lg font-bold text-white disabled:opacity-60">
        {pending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-base text-[#41546B]">
        {isSignup ? (
          <>Already have an account? <Link href="/login" className="font-bold underline">Log in</Link></>
        ) : (
          <>New here? <Link href="/signup" className="font-bold underline">Create account</Link></>
        )}
      </p>
    </form>
  );
}
