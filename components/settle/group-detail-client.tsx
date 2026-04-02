"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { ArrowRightLeft, Plus, RefreshCcw, UserPlus, Users } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  addGroupMember,
  createExpense,
  createSettlement,
  getGroup,
  getGroupBalances,
  getGroupExpenses,
  getGroupMembers,
  getGroupSettlements,
  getGroups,
  getUsersListSimple,
  removeGroupMember,
  type Expense,
  type Group,
  type GroupBalancesResponse,
  type GroupMember,
  type SimpleUser,
  type Settlement,
} from "@/lib/api";
import { formatCurrency, formatDate, fullName } from "@/lib/format";
import { useAuth } from "@/components/providers/auth-provider";

type GroupDetailClientProps = {
  groupId: string;
};

type GroupDetailData = {
  groups: Group[];
  group: Group | null;
  members: GroupMember[];
  expenses: Expense[];
  balances: GroupBalancesResponse | null;
  settlements: Settlement[];
};

export function GroupDetailClient({ groupId }: GroupDetailClientProps) {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [settlementDialogOpen, setSettlementDialogOpen] = useState(false);
  const [memberUserId, setMemberUserId] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    description: "",
    paidByUserId: "",
    totalAmount: "",
    currency: "MNT",
    expenseDate: new Date().toISOString().slice(0, 10),
    shares: {} as Record<string, string>,
  });
  const [settlementForm, setSettlementForm] = useState({
    fromUserId: "",
    toUserId: "",
    amount: "",
    currency: "MNT",
    settledAt: new Date().toISOString(),
    note: "",
  });
  const [data, setData] = useState<GroupDetailData>({
    groups: [],
    group: null,
    members: [],
    expenses: [],
    balances: null,
    settlements: [],
  });
  const [simpleUsers, setSimpleUsers] = useState<SimpleUser[]>([]);

  const load = useCallback(async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [groups, group, members, expenses, balances, settlements] =
        await Promise.all([
          getGroups(session.accessToken),
          getGroup(session.accessToken, groupId),
          getGroupMembers(session.accessToken, groupId),
          getGroupExpenses(session.accessToken, groupId),
          getGroupBalances(session.accessToken, groupId),
          getGroupSettlements(session.accessToken, groupId),
        ]);

      setData({ groups, group, members, expenses, balances, settlements });
      setExpenseForm((current) => ({
        ...current,
        paidByUserId: current.paidByUserId || members[0]?.userId || "",
        shares: Object.fromEntries(
          members.map((member) => [member.userId, current.shares[member.userId] || ""]),
        ),
      }));
      setSettlementForm((current) => ({
        ...current,
        fromUserId: current.fromUserId || members[0]?.userId || "",
        toUserId: current.toUserId || members[1]?.userId || members[0]?.userId || "",
      }));
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Группийн дэлгэрэнгүйг ачаалж чадсангүй.",
      );
    } finally {
      setLoading(false);
    }
  }, [groupId, session]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    async function loadSimpleUsers() {
      if (!session) {
        return;
      }

      try {
        setSimpleUsers(await getUsersListSimple(session.accessToken));
      } catch {
        // Keep the dialog usable even if the helper list fails to load.
      }
    }

    void loadSimpleUsers();
  }, [session]);

  const totalGroupDebt = useMemo(() => {
    return (
      data.balances?.pairwiseSettlements.reduce((sum, item) => sum + item.amount, 0) ?? 0
    );
  }, [data.balances]);

  const currentNetBalance = useMemo(() => {
    const me = data.balances?.members.find((member) => member.id === session?.user.id);
    return me?.netBalance ?? 0;
  }, [data.balances, session?.user.id]);

  const availableUsers = useMemo(() => {
    const memberIds = new Set(data.members.map((member) => member.userId));
    return simpleUsers.filter((user) => !memberIds.has(user.id));
  }, [data.members, simpleUsers]);

  const memberIdentityMap = useMemo(() => {
    return new Map(
      data.members.map((member) => [
        member.userId,
        {
          label: fullName(member),
          email: member.email,
          fullLabel: `${fullName(member)} (${member.email})`,
        },
      ]),
    );
  }, [data.members]);

  const openSettlementFromPairwise = useCallback(
    (item: NonNullable<GroupBalancesResponse["pairwiseSettlements"]>[number]) => {
      setSettlementForm((current) => ({
        ...current,
        fromUserId: item.fromUserId,
        toUserId: item.toUserId,
        amount: String(item.amount),
        currency: current.currency || "MNT",
        settledAt: new Date().toISOString(),
      }));
      setSettlementDialogOpen(true);
    },
    [],
  );

  return (
    <AuthGuard>
      <AppShell
        title={data.group?.name || "Группийн дэлгэрэнгүй"}
        description={
          data.group?.description ||
          "Гишүүд, зардал, үлдэгдлийн тойм, pairwise settlement, settlement түүхийг эндээс удирдана."
        }
        groups={data.groups}
        actions={
          <>
            <Button variant="outline" className="bg-secondary" onClick={() => void load()}>
              <RefreshCcw className="size-4" />
              Шинэчлэх
            </Button>
            <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-secondary">
                  <UserPlus className="size-4" />
                  Гишүүн нэмэх
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card">
                <DialogHeader>
                  <DialogTitle>Гишүүн нэмэх</DialogTitle>
                  <DialogDescription>POST /groups/:groupId/members API-г ашиглана.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="member-user-id">Хэрэглэгч сонгох</Label>
                  <select
                    id="member-user-id"
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                    value={memberUserId}
                    onChange={(event) => setMemberUserId(event.target.value)}
                  >
                    <option value="">Хэрэглэгч сонгоно уу</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {!availableUsers.length ? (
                    <p className="text-xs text-muted-foreground">
                      Нэмэх боломжтой хэрэглэгч олдсонгүй.
                    </p>
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
                          await addGroupMember(session.accessToken, groupId, {
                            userId: memberUserId,
                          });
                          setMemberDialogOpen(false);
                          setMemberUserId("");
                          await load();
                        } catch (nextError) {
                          const message =
                            nextError instanceof Error ? nextError.message : "Гишүүн нэмж чадсангүй.";
                          setError(message);
                          toast.error(message);
                        }
                      });
                    }}
                    disabled={pending || !memberUserId}
                  >
                    Нэмэх
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" />
                  Зардал нэмэх
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Зардал бүртгэх</DialogTitle>
                  <DialogDescription>POST /groups/:groupId/expenses API-г ашиглана.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id="expense-title"
                      label="Гарчиг"
                      value={expenseForm.title}
                      onChange={(value) =>
                        setExpenseForm((current) => ({ ...current, title: value }))
                      }
                    />
                    <Field
                      id="expense-amount"
                      label="Нийт дүн"
                      value={expenseForm.totalAmount}
                      onChange={(value) =>
                        setExpenseForm((current) => ({ ...current, totalAmount: value }))
                      }
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="expense-paid-by">Төлсөн хүн</Label>
                      <select
                        id="expense-paid-by"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                        value={expenseForm.paidByUserId}
                        onChange={(event) =>
                          setExpenseForm((current) => ({
                            ...current,
                            paidByUserId: event.target.value,
                          }))
                        }
                      >
                        {data.members.map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {fullName(member)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Field
                      id="expense-date"
                      label="Зардлын огноо"
                      type="date"
                      value={expenseForm.expenseDate}
                      onChange={(value) =>
                        setExpenseForm((current) => ({ ...current, expenseDate: value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-description">Тайлбар</Label>
                    <Textarea
                      id="expense-description"
                      value={expenseForm.description}
                      onChange={(event) =>
                        setExpenseForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-3 rounded-2xl border border-border bg-secondary p-4">
                    <p className="text-sm font-medium">Оролцогчдын хувь</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {data.members.map((member) => (
                        <Field
                          key={member.id}
                          id={`share-${member.userId}`}
                          label={fullName(member)}
                          value={expenseForm.shares[member.userId] || ""}
                          onChange={(value) =>
                            setExpenseForm((current) => ({
                              ...current,
                              shares: { ...current.shares, [member.userId]: value },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (!session) {
                        return;
                      }

                      startTransition(async () => {
                        try {
                          await createExpense(session.accessToken, groupId, {
                            title: expenseForm.title,
                            description: expenseForm.description,
                            paidByUserId: expenseForm.paidByUserId,
                            totalAmount: Number(expenseForm.totalAmount),
                            currency: expenseForm.currency,
                            expenseDate: expenseForm.expenseDate,
                            participants: data.members
                              .map((member) => ({
                                userId: member.userId,
                                shareAmount: Number(expenseForm.shares[member.userId] || 0),
                              }))
                              .filter((participant) => participant.shareAmount > 0),
                          });
                          setExpenseDialogOpen(false);
                          await load();
                        } catch (nextError) {
                          const message =
                            nextError instanceof Error ? nextError.message : "Зардал бүртгэж чадсангүй.";
                          setError(message);
                          toast.error(message);
                        }
                      });
                    }}
                    disabled={pending}
                  >
                    Хадгалах
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={settlementDialogOpen} onOpenChange={setSettlementDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <ArrowRightLeft className="size-4" />
                  Settlement бүртгэх
                </Button>
              </DialogTrigger>
              <DialogContent className="border-border bg-card">
                <DialogHeader>
                  <DialogTitle>Settlement бүртгэх</DialogTitle>
                  <DialogDescription>POST /groups/:groupId/settlements API-г ашиглана.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="settlement-from">Өгсөн хүн</Label>
                      <select
                        id="settlement-from"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                        value={settlementForm.fromUserId}
                        onChange={(event) =>
                          setSettlementForm((current) => ({
                            ...current,
                            fromUserId: event.target.value,
                          }))
                        }
                      >
                        {data.members.map((member) => (
                          <option key={member.id} value={member.userId}>
                            {fullName(member)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settlement-to">Хүлээн авсан хүн</Label>
                      <select
                        id="settlement-to"
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none"
                        value={settlementForm.toUserId}
                        onChange={(event) =>
                          setSettlementForm((current) => ({
                            ...current,
                            toUserId: event.target.value,
                          }))
                        }
                      >
                        {data.members.map((member) => (
                          <option key={member.id} value={member.userId}>
                            {fullName(member)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id="settlement-amount"
                      label="Дүн"
                      value={settlementForm.amount}
                      onChange={(value) =>
                        setSettlementForm((current) => ({ ...current, amount: value }))
                      }
                    />
                    <Field
                      id="settlement-date"
                      label="Төлбөр хийсэн огноо"
                      type="datetime-local"
                      value={settlementForm.settledAt.slice(0, 16)}
                      onChange={(value) =>
                        setSettlementForm((current) => ({ ...current, settledAt: value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settlement-note">Тэмдэглэл</Label>
                    <Textarea
                      id="settlement-note"
                      value={settlementForm.note}
                      onChange={(event) =>
                        setSettlementForm((current) => ({ ...current, note: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (!session) {
                        return;
                      }

                      startTransition(async () => {
                        try {
                          await createSettlement(session.accessToken, groupId, {
                            ...settlementForm,
                            amount: Number(settlementForm.amount),
                          });
                          setSettlementDialogOpen(false);
                          await load();
                        } catch (nextError) {
                          const message =
                            nextError instanceof Error
                              ? nextError.message
                              : "Settlement бүртгэж чадсангүй.";
                          setError(message);
                          toast.error(message);
                        }
                      });
                    }}
                    disabled={pending}
                  >
                    Хадгалах
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      >
        {error ? (
          <Card className="mb-4 border-destructive/20 bg-destructive/10">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              {loading ? (
                <>
                  <LoadingInfoCard />
                  <LoadingInfoCard />
                </>
              ) : (
                <>
                  <InfoCard title="Миний цэвэр үлдэгдэл" value={formatCurrency(currentNetBalance)} />
                  <InfoCard title="Группийн нээлттэй өр" value={formatCurrency(totalGroupDebt)} />
                </>
              )}
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Группийн самбар</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <GroupDetailPanelSkeleton />
                ) : !data.group ? (
                  <EmptyState
                    icon={Users}
                    title="Групп олдсонгүй"
                    description="Энэ группийн мэдээллийг backend-ээс ачаалж чадсангүй."
                  />
                ) : (
                  <Tabs defaultValue="members" className="flex flex-col gap-5">
                    <TabsList
                      variant="line"
                      className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-secondary p-1 md:grid-cols-4"
                    >
                      <TabsTrigger
                        value="members"
                        className="h-10 rounded-lg border border-transparent px-4 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-[#201c16] data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_rgba(200,175,121,0.08)] data-[state=active]:after:hidden"
                      >
                        Гишүүд
                      </TabsTrigger>
                      <TabsTrigger
                        value="expenses"
                        className="h-10 rounded-lg border border-transparent px-4 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-[#201c16] data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_rgba(200,175,121,0.08)] data-[state=active]:after:hidden"
                      >
                        Зардлууд
                      </TabsTrigger>
                      <TabsTrigger
                        value="balances"
                        className="h-10 rounded-lg border border-transparent px-4 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-[#201c16] data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_rgba(200,175,121,0.08)] data-[state=active]:after:hidden"
                      >
                        Үлдэгдэл
                      </TabsTrigger>
                      <TabsTrigger
                        value="settlements"
                        className="h-10 rounded-lg border border-transparent px-4 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-[#201c16] data-[state=active]:text-primary data-[state=active]:shadow-[inset_0_0_0_1px_rgba(200,175,121,0.08)] data-[state=active]:after:hidden"
                      >
                        Settlement-үүд
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="mt-0">
                      <div className="grid gap-3">
                        {data.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-2xl border border-border bg-secondary px-4 py-3"
                          >
                            <div>
                              <div className="font-medium">{fullName(member)}</div>
                              <div className="text-sm text-muted-foreground">{member.email}</div>
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                if (!session) {
                                  return;
                                }

                                startTransition(async () => {
                                  try {
                                    await removeGroupMember(session.accessToken, groupId, member.userId);
                                    await load();
                                  } catch (nextError) {
                                    const message =
                                      nextError instanceof Error
                                        ? nextError.message
                                        : "Гишүүнийг хасаж чадсангүй.";
                                    setError(message);
                                    toast.error(message);
                                  }
                                });
                              }}
                            >
                              Хасах
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="expenses" className="mt-0">
                      <ListCard
                        items={data.expenses}
                        emptyTitle="Зардал алга"
                        emptyDescription="Группийн зардлыг хувааж эхлэхийн тулд эхний зардлаа бүртгэнэ үү."
                        renderItem={(expense) => (
                          <div
                            key={expense.id}
                            className="rounded-2xl border border-border bg-secondary px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">{expense.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {expense.description || "Зардлын мөр"}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(expense.totalAmount, expense.currency)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(expense.expenseDate || expense.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </TabsContent>

                    <TabsContent value="balances" className="mt-0">
                      <div className="grid gap-3">
                        {data.balances?.members.map((member, index) => (
                          <div
                            key={member.id || member.email || `${fullName(member)}-${index}`}
                            className="rounded-2xl border border-border bg-secondary px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">{fullName(member)}</div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                              <div className="text-right font-semibold">
                                {formatCurrency(member.netBalance)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="settlements" className="mt-0">
                      <ListCard
                        items={data.settlements}
                        emptyTitle="Settlement алга"
                        emptyDescription="Гишүүд хооронд бодит төлбөр хийгдсэний дараа энд бүртгэнэ."
                        renderItem={(settlement) => (
                          <div
                            key={settlement.id}
                            className="rounded-2xl border border-border bg-secondary px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  {memberIdentityMap.get(settlement.fromUserId)?.fullLabel ||
                                    settlement.fromUser?.email ||
                                    settlement.fromUserId}{" "}
                                  →{" "}
                                  {memberIdentityMap.get(settlement.toUserId)?.fullLabel ||
                                    settlement.toUser?.email ||
                                    settlement.toUserId}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {settlement.note ||
                                    `${memberIdentityMap.get(settlement.fromUserId)?.email || settlement.fromUser?.email || settlement.fromUserId} → ${memberIdentityMap.get(settlement.toUserId)?.email || settlement.toUser?.email || settlement.toUserId}`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {formatCurrency(settlement.amount, settlement.currency)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(settlement.settledAt || settlement.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Pairwise settlement зураглал</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                ))
              ) : data.balances?.pairwiseSettlements.length ? (
                data.balances.pairwiseSettlements.map((item) => (
                  <button
                    type="button"
                    key={`${item.fromUserId}-${item.toUserId}-${item.amount}`}
                    className="w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-left transition-colors hover:bg-[#1b1b1b]"
                    onClick={() => openSettlementFromPairwise(item)}
                  >
                    <div className="font-medium">
                      {item.fromUserEmail || item.fromUserId} →{" "}
                      {item.toUserEmail || item.toUserId}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {formatCurrency(item.amount)}
                    </div>
                  </button>
                ))
              ) : (
                  <EmptyState
                    icon={ArrowRightLeft}
                    title="Pairwise өр алга"
                    description="Үлдэгдэл тооцооллоор гарсан хэн хэнд хэд өгөх мэдээлэл энд харагдана."
                  />
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-2 p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function LoadingInfoCard() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-36" />
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ListCard<T>({
  items,
  emptyTitle,
  emptyDescription,
  renderItem,
}: {
  items: T[];
  emptyTitle: string;
  emptyDescription: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (!items.length) {
    return (
      <EmptyState icon={Plus} title={emptyTitle} description={emptyDescription} />
    );
  }

  return <div className="grid gap-3">{items.map((item) => renderItem(item))}</div>;
}

function GroupDetailPanelSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-secondary p-1 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-lg" />
        ))}
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
