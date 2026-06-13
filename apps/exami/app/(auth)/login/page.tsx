"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";
import { useAuth, HOME_BY_ROLE } from "@/lib/store/auth";
import { decodeJwt } from "@/lib/utils";
import type { JwtClaims } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (tokens) => {
      signIn(tokens.accessToken, tokens.refreshToken);
      const claims = decodeJwt<JwtClaims>(tokens.accessToken);
      router.replace(claims ? HOME_BY_ROLE[claims.role] : "/");
    },
    onError: (e: ApiError) => setError(e.message || "Invalid credentials"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate();
  };

  return (
    <Card className={error ? "animate-shake" : ""}>
      <CardHeader>
        <CardTitle className="text-xl">Staff sign in</CardTitle>
        <CardDescription>
          Admins, examiners and invigilators sign in here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit}>
          <Field label="Email">
            <Input
              type="email"
              autoFocus
              required
              placeholder="you@institution.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password" error={error}>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full" loading={mutation.isPending}>
            Sign in
          </Button>
        </form>

        <div className="mt-5 border-t border-[var(--color-border)] pt-4 text-center text-sm text-[var(--color-muted)]">
          Taking an exam as a student?{" "}
          <Link href="/otp" className="font-medium text-[var(--color-brand)]">
            Sign in with OTP
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
