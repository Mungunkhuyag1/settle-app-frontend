"use client";

import { useEffect, useState, useTransition } from "react";
import { LoaderCircle, Save, UserRound } from "lucide-react";
import { AuthGuard } from "@/components/settle/auth-guard";
import { AppShell } from "@/components/settle/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { getCurrentUser, getGroups, updateCurrentUser, type Group } from "@/lib/api";

export function ProfileClient() {
  const { session, updateSessionUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    imageUrl: "",
  });

  useEffect(() => {
    async function load() {
      if (!session) {
        return;
      }

      try {
        const [user, nextGroups] = await Promise.all([
          getCurrentUser(session.accessToken),
          getGroups(session.accessToken),
        ]);

        setForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          imageUrl: user.imageUrl || "",
        });
        setGroups(nextGroups);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Профайл ачаалж чадсангүй.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [session]);

  return (
    <AuthGuard>
      <AppShell
        title="Профайл"
        description="GET /users/me болон PATCH /users/me энд холбогдсон."
        groups={groups}
      >
        <Card className="max-w-3xl border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5" />
              Миний профайл
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {loading ? (
              <div className="grid gap-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>
            ) : (
              <form
                className="grid gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  setError("");
                  setSuccess("");

                  if (!session) {
                    return;
                  }

                  startTransition(async () => {
                    try {
                      const user = await updateCurrentUser(session.accessToken, {
                        firstName: form.firstName,
                        lastName: form.lastName,
                        imageUrl: form.imageUrl || null,
                      });
                      updateSessionUser(user);
                      setSuccess("Профайл шинэчлэгдлээ.");
                    } catch (nextError) {
                      setError(
                        nextError instanceof Error ? nextError.message : "Профайл шинэчилж чадсангүй.",
                      );
                    }
                  });
                }}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-first-name">Нэр</Label>
                    <Input
                      id="profile-first-name"
                      value={form.firstName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, firstName: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-last-name">Овог</Label>
                    <Input
                      id="profile-last-name"
                      value={form.lastName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, lastName: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Имэйл</Label>
                  <Input id="profile-email" value={session?.user.email || ""} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-image-url">Зургийн URL</Label>
                  <Input
                    id="profile-image-url"
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, imageUrl: event.target.value }))
                    }
                  />
                </div>

                {error ? (
                  <div className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                    {success}
                  </div>
                ) : null}

                <Button type="submit" className="w-fit" disabled={pending}>
                  {pending && <LoaderCircle className="size-4 animate-spin" />}
                  <Save className="size-4" />
                  Профайл хадгалах
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </AppShell>
    </AuthGuard>
  );
}
