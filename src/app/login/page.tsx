"use client";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

const input = "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-base outline-none transition-colors focus:border-foreground/50";

export default function LoginPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "in" ? signIn : signUp, {});

  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-5xl tracking-tight">LifeOS</h1>
        <p className="mb-8 mt-2 text-muted">Training, learning, content and money in one place.</p>
        <form action={action} className="surface space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required className={input} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" minLength={8} required
              autoComplete={mode === "in" ? "current-password" : "new-password"} className={input} />
          </div>
          {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
          {state.message && <p role="status" className="text-sm text-personal">{state.message}</p>}
          <button disabled={pending} className="w-full rounded-xl bg-accent px-3 py-3 font-medium text-accent-fg disabled:opacity-60">
            {pending ? "Please wait..." : mode === "in" ? "Sign in" : "Create account"}
          </button>
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="w-full text-sm text-muted hover:text-foreground">
            {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
