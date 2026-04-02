"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { FolderPlus, RefreshCcw, Users } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/settle/auth-guard";
import { AppShell } from "@/components/settle/app-shell";
import { EmptyState } from "@/components/settle/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createGroup, getGroups, type Group } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

function translateRole(role?: string | null) {
  if (role === "owner") return "Эзэмшигч";
  if (role === "member") return "Гишүүн";
  return role || "Гишүүн";
}

export function GroupsClient() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      setGroups(await getGroups(session.accessToken));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Группүүдийг ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AuthGuard>
      <AppShell
        title="Группийн жагсаалт"
        description="Групп үүсгэх, тайлбар харах, үлдэгдэл, зардал, settlement рүү орох хэсэг."
        groups={groups}
        actions={
          <>
            <Button variant="outline" className="bg-secondary" onClick={() => void load()}>
              <RefreshCcw className="size-4" />
              Шинэчлэх
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <FolderPlus className="size-4" />
                  Групп үүсгэх
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Групп үүсгэх</DialogTitle>
                  <DialogDescription>POST /groups ашиглан шинэ групп үүсгэнэ.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Нэр</Label>
                    <Input
                      id="group-name"
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-description">Тайлбар</Label>
                    <Textarea
                      id="group-description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                    />
                  </div>
                  {error ? (
                    <div className="border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  ) : null}
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (!session) {
                        return;
                      }

                      startTransition(async () => {
                        try {
                          await createGroup(session.accessToken, form);
                          setDialogOpen(false);
                          setForm({ name: "", description: "" });
                          await load();
                        } catch (nextError) {
                          const message =
                            nextError instanceof Error ? nextError.message : "Групп үүсгэж чадсангүй.";
                          setError(message);
                          toast.error(message);
                        }
                      });
                    }}
                    disabled={pending}
                  >
                    Үүсгэх
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      >
        {error && !dialogOpen ? (
          <Card className="mb-4 border-destructive/20 bg-destructive/10">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="border-border bg-card">
                <CardHeader>
                  <Skeleton className="h-7 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !groups.length ? (
          <EmptyState
            icon={Users}
            title="Групп алга байна"
            description="Анхны группээ үүсгээд хамтын зардал, settlement-ээ удирдаж эхэлнэ үү."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-xl">{group.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {group.description || "Тайлбар алга"}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Гишүүд</span>
                    <span className="font-medium">{group.memberCount ?? "-"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Эрх</span>
                    <span className="font-medium">{translateRole(group.myRole)}</span>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/groups/${group.id}`}>Дэлгэрэнгүй харах</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}
