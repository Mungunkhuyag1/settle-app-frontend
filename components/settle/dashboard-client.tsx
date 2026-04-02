"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, CircleDollarSign, Landmark, RefreshCcw, ReceiptText } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/settle/auth-guard";
import { AppShell } from "@/components/settle/app-shell";
import { EmptyState } from "@/components/settle/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getGroups,
  getMyBalances,
  getMyExpenses,
  getMySettlements,
  getUsersListSimple,
  type Expense,
  type Group,
  type GroupBalance,
  type SimpleUser,
  type Settlement,
} from "@/lib/api";
import { formatCurrency, formatDate, fullName } from "@/lib/format";
import { useAuth } from "@/components/providers/auth-provider";

type DashboardData = {
  groups: Group[];
  balances: GroupBalance[];
  expenses: Expense[];
  settlements: Settlement[];
  users: SimpleUser[];
};

export function DashboardClient() {
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData>({
    groups: [],
    balances: [],
    expenses: [],
    settlements: [],
    users: [],
  });

  const load = useCallback(async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [groups, balances, expenses, settlements, users] = await Promise.all([
        getGroups(session.accessToken),
        getMyBalances(session.accessToken),
        getMyExpenses(session.accessToken),
        getMySettlements(session.accessToken),
        getUsersListSimple(session.accessToken),
      ]);

      setData({ groups, balances, expenses, settlements, users });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Хянах самбар ачаалж чадсангүй.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalReceivables = data.balances.reduce((sum, balance) => {
    return sum + balance.receivables.reduce((edgeSum, edge) => edgeSum + edge.amount, 0);
  }, 0);

  const totalPayables = data.balances.reduce((sum, balance) => {
    return sum + balance.payables.reduce((edgeSum, edge) => edgeSum + edge.amount, 0);
  }, 0);

  return (
    <AuthGuard>
      <AppShell
        title="Хянах самбар"
        description="Миний үлдэгдэл, миний зардал, миний settlement. Энэ дэлгэц нь /users/me/* болон /groups API-уудтай холбогдсон."
        groups={data.groups}
        actions={
          <Button variant="outline" className="bg-secondary" onClick={() => void load()}>
            <RefreshCcw className="size-4" />
            Шинэчлэх
          </Button>
        }
      >
        <div className="grid gap-4">
          {loading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <div className="grid gap-4 xl:grid-cols-[0.95fr_0.95fr_1.1fr]">
                <SummaryCard
                  icon={CircleDollarSign}
                  title="Надад өгөх нийт"
                  value={formatCurrency(totalReceivables)}
                  tone="text-[#10c79a]"
                />
                <SummaryCard
                  icon={Landmark}
                  title="Миний өгөх нийт"
                  value={formatCurrency(totalPayables)}
                  tone="text-destructive"
                />
                <SummaryCard
                  icon={ArrowRightLeft}
                  title="Идэвхтэй групп"
                  value={String(data.groups.length)}
                  tone="text-primary"
                />
              </div>

              {error ? (
                <Card className="border-destructive/20 bg-destructive/10">
                  <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
                </Card>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Группийн үлдэгдэл</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!data.balances.length ? (
                      <EmptyState
                        icon={ReceiptText}
                        title="Үлдэгдэл хараахан алга"
                        description="Та группт орж expense үүсгэсний дараа энд групп тус бүрийн үлдэгдэл гарна."
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Групп</TableHead>
                            <TableHead>Нийт</TableHead>
                            <TableHead>Авлага</TableHead>
                            <TableHead>Өглөг</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.balances.map((balance) => (
                            <TableRow
                              key={balance.groupId}
                              className="cursor-pointer"
                              onClick={() => router.push(`/groups/${balance.groupId}`)}
                            >
                              <TableCell>
                                <div className="font-medium">{balance.groupName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {balance.memberCount ?? 0} гишүүн
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(balance.netBalance)}</TableCell>
                              <TableCell>
                                {formatCurrency(
                                  balance.receivables.reduce((sum, item) => sum + item.amount, 0),
                                )}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(
                                  balance.payables.reduce((sum, item) => sum + item.amount, 0),
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle>Pairwise төлбөрийн дараагийн алхам</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {data.balances.flatMap((balance) => balance.payables).slice(0, 6).map((edge) => (
                      <div key={`${edge.userId}-${edge.amount}`} className="border border-border bg-secondary px-4 py-3">
                        <div className="text-sm font-medium">
                          {fullName(edge)} руу {formatCurrency(edge.amount)} төлнө
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Таны одоогийн группийн үлдэгдлээс тооцоолсон өглөг.
                        </div>
                      </div>
                    ))}
                    {!data.balances.some((balance) => balance.payables.length) && (
                      <EmptyState
                        icon={ArrowRightLeft}
                        title="Төлөх үлдэгдэл алга"
                        description="Settlement шаардлагатай pairwise өр гарвал энд харагдана."
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

          <div className="grid gap-4 xl:grid-cols-2">
                <ActivityTable title="Сүүлийн зардлууд" items={data.expenses} type="expense" users={data.users} />
                <ActivityTable title="Сүүлийн settlement-үүд" items={data.settlements} type="settlement" users={data.users} />
              </div>
            </>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[0.95fr_0.95fr_1.1fr]">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-border bg-card">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="grid grid-cols-4 gap-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <Skeleton className="h-6 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-2xl" />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-border bg-card">
            <CardHeader>
              <Skeleton className="h-6 w-44" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 4 }).map((__, row) => (
                <div key={row} className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: typeof CircleDollarSign;
  title: string;
  value: string;
  tone: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
        </div>
        <div className="flex size-11 items-center justify-center bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTable({
  title,
  items,
  type,
  users,
}: {
  title: string;
  items: Expense[] | Settlement[];
  type: "expense" | "settlement";
  users: SimpleUser[];
}) {
  const router = useRouter();
  const userMap = new Map(users.map((user) => [user.id, user]));

  function formatParty(
    user: Settlement["fromUser"] | Settlement["toUser"] | null | undefined,
    userId: string,
  ) {
    if (user) {
      const name = fullName(user);
      return `${name} (${user.email || userId})`;
    }

    const simpleUser = userMap.get(userId);
    if (simpleUser) {
      return `${simpleUser.name} (${simpleUser.email})`;
    }

    return userId;
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!items.length ? (
          <EmptyState
            icon={type === "expense" ? ReceiptText : ArrowRightLeft}
            title={type === "expense" ? "Зардал алга" : "Settlement алга"}
            description={
              type === "expense"
                ? "Шинэ зардал үүсгэсний дараа энэ хүснэгт дүүрнэ."
                : "Settlement бүртгэсний дараа энэ хүснэгт дүүрнэ."
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{type === "expense" ? "Гарчиг" : "Гүйлгээ"}</TableHead>
                <TableHead>Дүн</TableHead>
                <TableHead>Огноо</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.slice(0, 8).map((item) => {
                if (type === "expense") {
                  const expense = item as Expense;
                  return (
                    <TableRow
                      key={expense.id}
                      className={expense.groupId ? "cursor-pointer" : undefined}
                      onClick={() => {
                        if (expense.groupId) {
                          router.push(`/groups/${expense.groupId}`);
                        }
                      }}
                    >
                      <TableCell>
                        <div className="font-medium">{expense.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {expense.groupName || expense.description || "Зардлын мөр"}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(expense.totalAmount, expense.currency)}</TableCell>
                      <TableCell>{formatDate(expense.expenseDate || expense.createdAt)}</TableCell>
                    </TableRow>
                  );
                }

                const settlement = item as Settlement;
                return (
                  <TableRow
                    key={settlement.id}
                    className={settlement.groupId ? "cursor-pointer" : undefined}
                    onClick={() => {
                      if (settlement.groupId) {
                        router.push(`/groups/${settlement.groupId}`);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="font-medium">
                        {formatParty(settlement.fromUser, settlement.fromUserId)} →{" "}
                        {formatParty(settlement.toUser, settlement.toUserId)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {settlement.groupName || settlement.note || "Settlement бүртгэл"}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(settlement.amount, settlement.currency)}</TableCell>
                    <TableCell>{formatDate(settlement.settledAt || settlement.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
