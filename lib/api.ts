const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3002/api/v1";

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl?: string | null;
  lastSeenAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type SimpleUser = {
  id: string;
  name: string;
  email: string;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: "owner" | "member" | string;
  joinedAt?: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type Session = {
  accessToken: string;
  tokenType?: string;
  expiresIn?: string;
  user: User;
};

export type Group = {
  id: string;
  name: string;
  description?: string | null;
  memberCount?: number;
  myRole?: string | null;
};

export type GroupBalance = {
  groupId: string;
  groupName: string;
  groupDescription?: string | null;
  myRole?: string | null;
  memberCount?: number;
  netBalance: number;
  receivables: BalanceEdge[];
  payables: BalanceEdge[];
};

export type BalanceEdge = {
  userId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  amount: number;
};

export type ExpenseParticipant = {
  userId: string;
  shareAmount: number;
};

export type Expense = {
  id: string;
  groupId?: string;
  groupName?: string;
  title: string;
  description?: string | null;
  paidByUserId?: string;
  paidByUser?: User | null;
  totalAmount: number;
  currency?: string;
  expenseDate?: string;
  createdAt?: string;
  participants?: ExpenseParticipant[];
};

export type Settlement = {
  id: string;
  groupId?: string;
  groupName?: string;
  fromUserId: string;
  toUserId: string;
  fromUser?: User | null;
  toUser?: User | null;
  amount: number;
  currency?: string;
  settledAt?: string;
  note?: string | null;
  createdAt?: string;
};

export type GroupBalancesResponse = {
  members: Array<
    User & {
      netBalance: number;
      receivables: BalanceEdge[];
      payables: BalanceEdge[];
    }
  >;
  pairwiseSettlements: Array<{
    fromUserId: string;
    fromUserEmail?: string | null;
    toUserId: string;
    toUserEmail?: string | null;
    amount: number;
  }>;
};

export type ApiError = Error & {
  status?: number;
  payload?: unknown;
};

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof payload === "string"
        ? payload
        : ((payload as { message?: string })?.message ??
          `Request failed with status ${response.status}`),
    ) as ApiError;

    error.status = response.status;
    error.payload = payload;

    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    throw error;
  }

  return payload as T;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function signIn(payload: { email: string; password: string }) {
  return apiRequest<Session>("/auth/sign-in", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function signUp(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return apiRequest<Session>("/auth/sign-up", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAuthMe(token: string) {
  return apiRequest<User>("/auth/me", { token });
}

export function getCurrentUser(token: string) {
  return apiRequest<User>("/users/me", { token });
}

export function getUsersListSimple(token: string) {
  return apiRequest<SimpleUser[]>("/users/list/simple", { token });
}

export function updateCurrentUser(
  token: string,
  payload: Partial<Pick<User, "firstName" | "lastName" | "imageUrl">>,
) {
  return apiRequest<User>("/users/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function getMyBalances(token: string) {
  return apiRequest<GroupBalance[]>("/users/me/balances", { token });
}

export function getMyExpenses(token: string) {
  return apiRequest<Expense[]>("/users/me/expenses", { token });
}

export function getMySettlements(token: string) {
  return apiRequest<Settlement[]>("/users/me/settlements", { token });
}

export function getGroups(token: string) {
  return apiRequest<Group[]>("/groups", { token });
}

export function createGroup(
  token: string,
  payload: { name: string; description?: string },
) {
  return apiRequest<Group>("/groups", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getGroup(token: string, groupId: string) {
  return apiRequest<Group>(`/groups/${groupId}`, { token });
}

export function getGroupMembers(token: string, groupId: string) {
  return apiRequest<GroupMember[]>(`/groups/${groupId}/members`, { token });
}

export function addGroupMember(
  token: string,
  groupId: string,
  payload: { userId: string },
) {
  return apiRequest(`/groups/${groupId}/members`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function removeGroupMember(token: string, groupId: string, userId: string) {
  return apiRequest(`/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
    token,
  });
}

export function getGroupExpenses(token: string, groupId: string) {
  return apiRequest<Expense[]>(`/groups/${groupId}/expenses`, { token });
}

export function createExpense(
  token: string,
  groupId: string,
  payload: {
    title: string;
    description?: string;
    paidByUserId: string;
    totalAmount: number;
    currency: string;
    expenseDate: string;
    participants: ExpenseParticipant[];
  },
) {
  return apiRequest<Expense>(`/groups/${groupId}/expenses`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function getGroupBalances(token: string, groupId: string) {
  return apiRequest<GroupBalancesResponse>(`/groups/${groupId}/balances`, { token });
}

export function getGroupSettlements(token: string, groupId: string) {
  return apiRequest<Settlement[]>(`/groups/${groupId}/settlements`, { token });
}

export function createSettlement(
  token: string,
  groupId: string,
  payload: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
    settledAt: string;
    note?: string;
  },
) {
  return apiRequest<Settlement>(`/groups/${groupId}/settlements`, {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}
