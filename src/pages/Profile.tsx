import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Heart, PenTool, LogOut, Edit2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI, postAPI, devotionalAPI, prayerAPI } from "@/services/api";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string | null;
  followers_count: number;
  following_count: number;
}

interface Post {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface Devotional {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Prayer {
  id: string;
  title: string;
  description: string;
  prayer_count: number;
  created_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"devotionals" | "prayers" | "posts">("devotionals");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", email: "", bio: "" });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [userData, postsData, devotionalsData, prayersData] = await Promise.all([
        userAPI.getProfile(),
        postAPI.getAll(),
        devotionalAPI.getAll(),
        prayerAPI.getAll(),
      ]);

      const u = userData as User;
      setUser(u);
      setEditForm({ username: u.username, email: u.email, bio: u.bio || "" });

      const allPosts = postsData as any[];
      const allDevotionals = devotionalsData as any[];
      const allPrayers = prayersData as any[];

      setPosts(allPosts.filter((p: any) => p.user.id === u.id));
      setDevotionals(allDevotionals.filter((d: any) => d.user.id === u.id));
      setPrayers(allPrayers.filter((p: any) => p.user.id === u.id));
    } catch (error) {
      toast.error("No se pudo cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    navigate("/auth");
  };

  const handleUpdateProfile = async () => {
    try {
      await userAPI.updateProfile(editForm);
      toast.success("Perfil actualizado");
      setEditDialogOpen(false);
      loadUserData();
    } catch (error) {
      toast.error("No se pudo actualizar el perfil");
    }
  };

  const getUserInitials = (username: string) => username.slice(0, 2).toUpperCase();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <p className="text-muted-foreground">No se pudo cargar el perfil</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl space-y-6">
        {/* Profile header card */}
        <div className="bible-glass-card p-0 overflow-hidden">
          {/* Top gradient banner */}
          <div className="h-20 bg-gradient-to-r from-orange-500/30 via-orange-400/20 to-purple-500/20 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/40" />
          </div>

          <div className="px-6 pb-6 -mt-10 relative">
            {/* Avatar + actions */}
            <div className="flex items-end justify-between mb-4">
              <div className="w-20 h-20 rounded-2xl bg-orange-500/20 border-2 border-orange-400/30 flex items-center justify-center text-2xl font-bold text-orange-400 shadow-lg">
                {getUserInitials(user.username)}
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </DialogTrigger>
                  <DialogContent className="border-orange-400/20">
                    <DialogHeader>
                      <DialogTitle className="text-orange-400">Editar Perfil</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Usuario</label>
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          placeholder="Nombre de usuario"
                          className="bg-white/5 border-white/10 focus-visible:ring-orange-400/30 focus-visible:border-orange-400/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <Input
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="tu@email.com"
                          type="email"
                          className="bg-white/5 border-white/10 focus-visible:ring-orange-400/30 focus-visible:border-orange-400/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-muted-foreground">Bio</label>
                        <Textarea
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          placeholder="Cuéntanos sobre ti..."
                          className="min-h-[100px] bg-white/5 border-white/10 focus-visible:ring-orange-400/30 focus-visible:border-orange-400/50"
                        />
                      </div>
                      <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <button
                          onClick={handleUpdateProfile}
                          className="bible-card-sunset font-medium text-sm"
                          style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }}
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-red-400 hover:border-red-400/20 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Salir
                </button>
              </div>
            </div>

            {/* User info */}
            <h2 className="text-xl font-bold">{user.username}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.bio && <p className="text-sm mt-2 max-w-md">{user.bio}</p>}

            {/* Stats row */}
            <div className="flex gap-6 mt-5 pt-4 border-t border-white/5">
              <div className="text-center">
                <p className="text-xl font-bold text-orange-400">{devotionals.length}</p>
                <p className="text-xs text-muted-foreground">Devocionales</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-purple-400">{prayers.length}</p>
                <p className="text-xs text-muted-foreground">Oraciones</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-emerald-400">{posts.length}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Custom tab switcher */}
        <div className="flex rounded-xl bg-white/5 p-1">
          {(["devotionals", "prayers", "posts"] as const).map((tab) => {
            const labels = { devotionals: "Devocionales", prayers: "Oraciones", posts: "Posts" };
            const activeColors = {
              devotionals: "bg-orange-500/20 text-orange-400 border-orange-400/20",
              prayers: "bg-purple-500/20 text-purple-400 border-purple-400/20",
              posts: "bg-emerald-500/20 text-emerald-400 border-emerald-400/20",
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? `${activeColors[tab]} border`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="space-y-3">
          {/* Devotionals tab */}
          {activeTab === "devotionals" && (
            devotionals.length === 0 ? (
              <div className="bible-glass-card flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="w-8 h-8 text-orange-400/30 mb-3" />
                <p className="text-muted-foreground text-sm">Sin devocionales todavía</p>
              </div>
            ) : (
              devotionals.map((devotional) => (
                <div key={devotional.id} className="bible-glass-card p-0 border-l-4 border-l-orange-400 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="h-4 w-4 text-orange-400 shrink-0" />
                      <h3 className="font-semibold text-sm">{devotional.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {devotional.content.substring(0, 120)}...
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(devotional.created_at)}</p>
                  </div>
                </div>
              ))
            )
          )}

          {/* Prayers tab */}
          {activeTab === "prayers" && (
            prayers.length === 0 ? (
              <div className="bible-glass-card flex flex-col items-center justify-center py-12 text-center">
                <Heart className="w-8 h-8 text-purple-400/30 mb-3" />
                <p className="text-muted-foreground text-sm">Sin peticiones todavía</p>
              </div>
            ) : (
              prayers.map((prayer) => (
                <div key={prayer.id} className="bible-glass-card p-0 border-l-4 border-l-purple-400 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-purple-400 shrink-0" />
                      <h3 className="font-semibold text-sm">{prayer.title}</h3>
                    </div>
                    {prayer.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{prayer.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {prayer.prayer_count} personas oraron · {formatDate(prayer.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )
          )}

          {/* Posts tab */}
          {activeTab === "posts" && (
            posts.length === 0 ? (
              <div className="bible-glass-card flex flex-col items-center justify-center py-12 text-center">
                <PenTool className="w-8 h-8 text-emerald-400/30 mb-3" />
                <p className="text-muted-foreground text-sm">Sin posts todavía</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bible-glass-card p-0 overflow-hidden">
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mb-3">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-white/5">
                      <span>{post.likes_count} likes</span>
                      <span>·</span>
                      <span>{post.comments_count} comentarios</span>
                      <span>·</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
