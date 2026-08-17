"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { login, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="paper w-full max-w-sm rounded-2xl border border-border bg-card p-8">
        <h1 className="text-center text-3xl">The Happy Fig</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Admin sign in</p>

        <form action={formAction} className="mt-8 flex flex-col gap-5">
          <Field label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
