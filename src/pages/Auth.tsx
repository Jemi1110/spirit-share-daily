import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Loader2 } from "lucide-react";
import { authAPI } from "@/services/api";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ username: "", email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authAPI.login(loginData.email, loginData.password);
      toast.success("Welcome back!");
      navigate("/feed");
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authAPI.register(signupData);
      toast.success("Account created! Please log in.");
      setActiveTab("login");
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glow decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-400/20 mb-4">
            <BookOpen className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Bibly</h1>
          <p className="text-muted-foreground text-sm mt-1">Conecta con Dios y la comunidad</p>
        </div>

        {/* Glass card */}
        <div className="bible-glass-card">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-400/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === "signup"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-400/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Login form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-muted-foreground text-sm">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-orange-400/50 focus:ring-orange-400/20 placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-muted-foreground text-sm">
                  Contraseña
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-orange-400/50 focus:ring-orange-400/20 placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bible-card-sunset flex items-center justify-center gap-2 py-3 px-6 font-semibold rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ borderRadius: "0.75rem", padding: "0.75rem 1.5rem" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          )}

          {/* Signup form */}
          {activeTab === "signup" && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username" className="text-muted-foreground text-sm">
                  Usuario
                </Label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="johndoe"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-orange-400/50 focus:ring-orange-400/20 placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-muted-foreground text-sm">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="tu@email.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-orange-400/50 focus:ring-orange-400/20 placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-muted-foreground text-sm">
                  Contraseña
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••••"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-orange-400/50 focus:ring-orange-400/20 placeholder:text-muted-foreground/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bible-card-sunset flex items-center justify-center gap-2 py-3 px-6 font-semibold rounded-xl transition-all duration-200 hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ borderRadius: "0.75rem", padding: "0.75rem 1.5rem" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
