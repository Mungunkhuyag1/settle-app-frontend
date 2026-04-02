"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Bell,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  UserRound,
  Users,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { fullName } from "@/lib/format";
import { useAuth } from "@/components/providers/auth-provider";
import type { Group } from "@/lib/api";

type AppShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
  groups?: Group[];
};

const mainItems = [
  { href: "/dashboard", label: "Хянах самбар", icon: LayoutDashboard, exact: true },
  { href: "/groups", label: "Группүүд", icon: ReceiptText },
];

export function AppShell({
  children,
  title,
  description,
  actions,
  groups = [],
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useAuth();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="px-3 py-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                tooltip="Settle"
                className="h-12 rounded-xl data-[active=true]:bg-sidebar-accent"
              >
                <Link href="/dashboard">
                  <div className="flex size-8 items-center justify-center rounded-md border border-border bg-[#141414] text-primary">
                    <ArrowRightLeft className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="font-heading text-base font-semibold uppercase tracking-[0.2em] text-foreground">
                      Settle
                    </span>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                      Зардал хянах систем
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="px-3 pt-3">
          <SidebarGroup className="mb-5 p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Ерөнхий
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href, item.exact)}
                      tooltip={item.label}
                      className="h-10 rounded-xl !bg-transparent px-4 text-muted-foreground data-[active=true]:!bg-[#1f1f1f] data-[active=true]:text-foreground hover:!bg-[#1f1f1f] hover:text-foreground"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mb-5 p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Миний группүүд
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {groups.slice(0, 6).map((group) => (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/groups/${group.id}`}
                      tooltip={group.name}
                      className="h-auto min-h-11 rounded-xl !bg-transparent px-4 py-2.5 text-muted-foreground data-[active=true]:!bg-[#1f1f1f] data-[active=true]:text-foreground hover:!bg-[#1f1f1f] hover:text-foreground"
                    >
                      <Link href={`/groups/${group.id}`}>
                        <Users />
                        <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                          <span className="truncate text-sm font-medium">{group.name}</span>
                          <span className="mt-1 truncate text-[10px] text-muted-foreground">
                            {group.description || `${group.memberCount ?? 0} гишүүн`}
                          </span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {!groups.length && (
                  <div className="px-2 py-2 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
                    Групп алга байна.
                  </div>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* <SidebarGroup className="mt-auto p-0">
            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Хэрэглэгч
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      className="h-10 rounded-xl !bg-transparent px-4 text-muted-foreground data-[active=true]:!bg-[#1f1f1f] data-[active=true]:text-foreground hover:!bg-[#1f1f1f] hover:text-foreground"
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup> */}
        </SidebarContent>

        <SidebarFooter className="px-3 py-4">
          <SidebarSeparator className="mb-2" />
          <SidebarMenu className="gap-1.5">
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-[#121212] px-3 py-3 text-left transition-colors hover:bg-[#181818] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0"
                  >
                    <Avatar className="size-8 border border-border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {session?.user.firstName?.[0] || session?.user.email?.[0] || "С"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                      <div className="truncate text-sm font-semibold">
                        {session ? fullName(session.user) : "Тодорхойгүй хэрэглэгч"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {session?.user.email || "unknown@example.com"}
                      </div>
                    </div>
                    <ChevronsUpDown className="size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-64 rounded-xl border-border bg-[#121212] text-foreground"
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="size-8 border border-border">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {session?.user.firstName?.[0] || session?.user.email?.[0] || "С"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {session ? fullName(session.user) : "Тодорхойгүй хэрэглэгч"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {session?.user.email || "unknown@example.com"}
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2 focus:bg-[#1f1f1f]">
                    <Link href="/profile" className="flex items-center gap-3">
                      <UserRound className="size-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-md px-3 py-2 focus:bg-[#1f1f1f]">
                    <Bell className="size-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-md px-3 py-2 focus:bg-[#1f1f1f]"
                    onClick={() => {
                      signOut();
                      router.push("/sign-in");
                    }}
                  >
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Гарах"
                className="rounded-xl text-muted-foreground group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center md:hidden"
                onClick={() => {
                  signOut();
                  router.push("/sign-in");
                }}
              >
                <LogOut />
                <span>Гарах</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-screen bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
          <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6 lg:py-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="border border-border bg-card hover:bg-sidebar-accent" />
                <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <ArrowRightLeft className="size-3.5" />
                  Settle самбар
                </div>
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold text-balance lg:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 line-clamp-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
