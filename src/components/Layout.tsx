import { Link, useLocation } from "react-router-dom";
import { BookOpen, Heart, Home, MessageSquare, PenTool, User, Search, Clock, Highlighter, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Inicio", path: "/feed" },
    { icon: Search, label: "Explorar", path: "/bible" },
    { icon: PenTool, label: "Devocionales", path: "/devotionals" },
    { icon: Heart, label: "Oración", path: "/prayer" },
    { icon: MessageSquare, label: "Blog", path: "/blog" },
    { icon: User, label: "Perfil", path: "/profile" },
  ];

  const mobileNavItems = [
    { icon: Home, label: "Inicio", path: "/feed" },
    { icon: Search, label: "Explorar", path: "/bible" },
    { icon: Clock, label: "Planes", path: "/devotionals" },
    { icon: User, label: "Perfil", path: "/profile" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        {/* Sidebar */}
        <div className="w-80 min-h-screen bg-card/50 backdrop-blur-lg border-r border-border p-6 space-y-6 fixed left-0 top-0 bottom-0 overflow-y-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <Link to="/feed" className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-orange-400" />
                <span className="text-lg font-medium text-muted-foreground">Bibly</span>
              </Link>
              <ThemeToggle />
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== "/feed" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-gray-500/10 text-gray-400"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-80 p-8">
          {children}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="p-4 pb-20">
          {children}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border z-50">
          <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== "/feed" && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-1 p-2"
                >
                  {isActive ? (
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className={cn(
                    "text-xs",
                    isActive ? "text-gray-400 font-medium" : "text-muted-foreground"
                  )}>
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
