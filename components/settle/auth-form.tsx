"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/providers/auth-provider";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  redirectTarget: string;
};

export function AuthForm({ mode, redirectTarget }: AuthFormProps) {
  const router = useRouter();
  const { initialized, session, signInWithPassword, signUpWithPassword } = useAuth();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const isSignIn = mode === "sign-in";

  useEffect(() => {
    if (initialized && session) {
      router.replace("/dashboard");
    }
  }, [initialized, router, session]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(200,175,121,0.10),_transparent_20%),linear-gradient(180deg,_#080808_0%,_#040404_100%)] text-foreground">
      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Settle</p>
          </div>

          <Card className="border-border bg-[#0d0d0d] shadow-none">
            <CardHeader className="space-y-2 pb-4">
              <CardTitle className="font-heading text-4xl font-bold">
                {isSignIn ? "Нэвтрэх" : "Бүртгүүлэх"}
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-muted-foreground">
                {isSignIn ? "Имэйл болон нууц үгээ оруулна уу." : "Шинэ бүртгэлийн мэдээллээ оруулна уу."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setError("");

                  startTransition(async () => {
                    try {
                      if (isSignIn) {
                        await signInWithPassword({
                          email: form.email,
                          password: form.password,
                        });
                      } else {
                        await signUpWithPassword(form);
                      }
                      router.replace(redirectTarget);
                    } catch (nextError) {
                      setError(
                        nextError instanceof Error ? nextError.message : "Нэвтрэлт амжилтгүй.",
                      );
                    }
                  });
                }}
              >
                {!isSignIn && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Нэр</Label>
                      <Input
                        id="firstName"
                        required
                        value={form.firstName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, firstName: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Овог</Label>
                      <Input
                        id="lastName"
                        required
                        value={form.lastName}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, lastName: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Имэйл</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Нууц үг</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </div>

                {error ? (
                  <div className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" size="lg" className="w-full gap-2" disabled={pending}>
                  {pending && <LoaderCircle className="size-4 animate-spin" />}
                  {isSignIn ? "Нэвтрэх" : "Бүртгэл үүсгэх"}
                  <ArrowRight className="size-4" />
                </Button>
              </form>

              <div className="border border-border bg-card px-4 py-4 text-sm text-muted-foreground">
                {isSignIn ? (
                  <p>
                    Бүртгэлгүй юу?{" "}
                    <Link href="/sign-up" className="font-medium text-primary">
                      Бүртгүүлэх
                    </Link>
                  </p>
                ) : (
                  <p>
                    Аль хэдийн бүртгэлтэй юу?{" "}
                    <Link href="/sign-in" className="font-medium text-primary">
                      Нэвтрэх
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
