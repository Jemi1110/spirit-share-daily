import { Link, useLocation } from "react-router-dom";
import { BookOpen, Heart, Home, MessageSquare, PenTool, User, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useQuery } from "@tanstack/react-query";
import { userAPI } from "@/services/api";

const navItems = [
  {
    icon: Home,
    label: "Inicio",
    path: "/feed",
    color: "text-orange-400",
    activeBg: "bg-orange-500/10",
    activeBorder: "border-orange-400/20",
  },
  {
    icon: Search,
    label: "Explorar",
    path: "/bible",
    color: "text-teal-400",
    activeBg: "bg-teal-500/10",
    activeBorder: "border-teal-400/20",
  },
  {
    icon: PenTool,
    label: "Devocionales",
    path: "/devotionals",
    color: "text-amber-400",
    activeBg: "bg-amber-500/10",
    activeBorder: "border-amber-400/20",
  },
  {
    icon: Heart,
    label: "Oración",
    path: "/prayer",
    color: "text-purple-400",
    activeBg: "bg-purple-500/10",
    activeBorder: "border-purple-400/20",
  },
  {
    icon: MessageSquare,
    label: "Blog",
    path: "/blog",
    color: "text-emerald-400",
    activeBg: "bg-emerald-500/10",
    activeBorder: "border-emerald-400/20",
  },
  {
    icon: User,
    label: "Perfil",
    path: "/profile",
    color: "text-sky-400",
    activeBg: "bg-sky-500/10",
    activeBorder: "border-sky-400/20",
  },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const { data: userProfile } = useQuery<any>({
    queryKey: ["profile"],
    queryFn: () => userAPI.getProfile(),
    staleTime: 5 * 60 * 1000,
  });

  const userName = userProfile?.username || userProfile?.first_name || null;
  const userInitials = userName ? userName.slice(0, 2).toUpperCase() : "?";

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/feed" && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <div className="w-72 min-h-screen bg-card/50 backdrop-blur-lg border-r border-border p-5 fixed left-0 top-0 bottom-0 overflow-y-auto flex flex-col">
          {/* Brand */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/feed" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-base font-bold">Bibly</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 border",
                    active
                      ? `${item.activeBg} ${item.activeBorder} ${item.color}`
                      : "text-muted-foreground hover:bg-white/5 border-transparent"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className={cn("text-sm", active ? "font-medium" : "")}>
                    {item.label}
                  </span>
                  {active && (
                    <div className={cn("ml-auto w-1.5 h-1.5 rounded-full", item.color.replace("text-", "bg-"))} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="mt-6 pt-4 border-t border-border">
            <Link
              to="/profile"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border",
                isActive("/profile")
                  ? "bg-sky-500/10 border-sky-400/20 text-sky-400"
                  : "hover:bg-white/5 border-transparent text-muted-foreground"
              )}
            >
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-400/20 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {userName || "Mi perfil"}
                </p>
                <p className="text-xs text-muted-foreground">Ver perfil</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-72 p-8">{children}</div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="p-4 pb-24">{children}</div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50">
          <div className="flex items-center justify-around py-2 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-1 flex-1 py-1"
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 border",
                      active
                        ? `${item.activeBg} ${item.activeBorder}`
                        : "border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        active ? item.color : "text-muted-foreground"
                      )}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] transition-colors",
                      active ? item.color : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
