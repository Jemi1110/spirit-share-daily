import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PenTool, Edit2, Trash2, Save, X, Eye, Loader2 } from "lucide-react";
import { blogAPI } from "@/services/api";
import { toast } from "sonner";

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
  };
}

const Blog = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "" });
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const data = await blogAPI.getAll();
      setArticles(data as BlogArticle[]);
    } catch (error) {
      toast.error("No se pudieron cargar los artículos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!newArticle.title.trim() || !newArticle.content.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      await blogAPI.create(newArticle);
      setNewArticle({ title: "", content: "" });
      setIsDialogOpen(false);
      toast.success("¡Artículo publicado!");
      loadArticles();
    } catch (error) {
      toast.error("No se pudo publicar el artículo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    try {
      await blogAPI.delete(id);
      toast.success("Artículo eliminado");
      loadArticles();
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  const startEditing = (article: BlogArticle) => {
    setEditingId(article.id);
    setEditForm({ title: article.title, content: article.content });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ title: "", content: "" });
  };

  const handleUpdateArticle = async (id: string) => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    try {
      await blogAPI.update(id, editForm);
      toast.success("Artículo actualizado");
      setEditingId(null);
      setEditForm({ title: "", content: "" });
      loadArticles();
    } catch (error) {
      toast.error("No se pudo actualizar");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getReadTime = (content: string) => {
    const words = content.split(" ").length;
    const mins = Math.ceil(words / 200);
    return `${mins} min`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/20">
              <PenTool className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold">Blog & Reflexiones</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/20 rounded-xl px-4 py-2 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-all">
                <Plus className="w-4 h-4" />
                Escribir
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] border-emerald-400/20">
              <DialogHeader>
                <DialogTitle className="text-emerald-400">Nuevo Artículo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="article-title" className="text-muted-foreground text-sm">Título</Label>
                  <Input
                    id="article-title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    placeholder="Título del artículo"
                    className="bg-white/5 border-white/10 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="article-content" className="text-muted-foreground text-sm">Contenido</Label>
                  <Textarea
                    id="article-content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    placeholder="Comparte tus pensamientos y reflexiones..."
                    className="min-h-[300px] bg-white/5 border-white/10 focus-visible:ring-emerald-400/30 focus-visible:border-emerald-400/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <button
                  onClick={handleCreateArticle}
                  disabled={submitting}
                  className="flex items-center gap-2 bible-card-green font-medium text-sm disabled:opacity-50"
                  style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Articles */}
        <div className="space-y-4">
          {articles.length === 0 ? (
            <div className="bible-glass-card flex flex-col items-center justify-center py-14 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-400/10 mb-4">
                <PenTool className="w-6 h-6 text-emerald-400/40" />
              </div>
              <p className="text-muted-foreground">Aún no hay artículos.</p>
              <p className="text-sm text-muted-foreground">¡Escribe el primero!</p>
            </div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="bible-glass-card p-0 overflow-hidden">
                <div className="p-5">
                  {/* Title row */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    {editingId === article.id ? (
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="text-base font-semibold"
                      />
                    ) : (
                      <h3
                        className="text-lg font-semibold leading-snug cursor-pointer hover:text-emerald-400 transition-colors"
                        onClick={() => navigate(`/blog/${article.id}`)}
                      >
                        {article.title}
                      </h3>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === article.id ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateArticle(article.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/blog/${article.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => startEditing(article)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  {editingId === article.id ? (
                    <Textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="min-h-[200px]"
                    />
                  ) : (
                    <p
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => navigate(`/blog/${article.id}`)}
                    >
                      {article.content.length > 200
                        ? article.content.substring(0, 200) + "..."
                        : article.content}
                    </p>
                  )}

                  {/* Footer */}
                  {editingId !== article.id && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{article.user.username}</span>
                        <span>·</span>
                        <span>{formatDate(article.created_at)}</span>
                        <span>·</span>
                        <span>{getReadTime(article.content)} lectura</span>
                      </div>
                      <button
                        onClick={() => navigate(`/blog/${article.id}`)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                      >
                        Leer más →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
