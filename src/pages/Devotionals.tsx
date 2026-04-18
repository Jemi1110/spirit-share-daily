import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, Edit2, Trash2, Save, X, Eye, Loader2 } from "lucide-react";
import { devotionalAPI } from "@/services/api";
import { toast } from "sonner";

interface Devotional {
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

const Devotionals = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDevotional, setNewDevotional] = useState({ title: "", content: "" });
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDevotionals();
  }, []);

  const loadDevotionals = async () => {
    try {
      const data = await devotionalAPI.getAll();
      setDevotionals(data as Devotional[]);
    } catch (error) {
      toast.error("No se pudieron cargar los devocionales");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevotional = async () => {
    if (!newDevotional.title.trim() || !newDevotional.content.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      await devotionalAPI.create(newDevotional);
      setNewDevotional({ title: "", content: "" });
      setIsDialogOpen(false);
      toast.success("¡Devocional creado!");
      loadDevotionals();
    } catch (error) {
      toast.error("No se pudo crear el devocional");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevotional = async (id: string) => {
    if (!confirm("¿Eliminar este devocional?")) return;
    try {
      await devotionalAPI.delete(id);
      toast.success("Devocional eliminado");
      loadDevotionals();
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  const startEditing = (devotional: Devotional) => {
    setEditingId(devotional.id);
    setEditForm({ title: devotional.title, content: devotional.content });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ title: "", content: "" });
  };

  const handleUpdateDevotional = async (id: string) => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }
    try {
      await devotionalAPI.update(id, editForm);
      toast.success("Devocional actualizado");
      setEditingId(null);
      setEditForm({ title: "", content: "" });
      loadDevotionals();
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

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
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
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-400/20">
              <BookOpen className="w-5 h-5 text-orange-400" />
            </div>
            <h1 className="text-2xl font-bold">Mis Devocionales</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 bg-orange-500/20 border border-orange-400/20 rounded-xl px-4 py-2 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition-all">
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-orange-400/20">
              <DialogHeader>
                <DialogTitle className="text-orange-400">Nuevo Devocional</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-muted-foreground text-sm">Título</Label>
                  <Input
                    id="title"
                    value={newDevotional.title}
                    onChange={(e) => setNewDevotional({ ...newDevotional, title: e.target.value })}
                    placeholder="Título del devocional"
                    className="bg-white/5 border-white/10 focus-visible:ring-orange-400/30 focus-visible:border-orange-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-muted-foreground text-sm">Contenido</Label>
                  <Textarea
                    id="content"
                    value={newDevotional.content}
                    onChange={(e) => setNewDevotional({ ...newDevotional, content: e.target.value })}
                    placeholder="Escribe tu devocional..."
                    className="min-h-[200px] bg-white/5 border-white/10 focus-visible:ring-orange-400/30 focus-visible:border-orange-400/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <button
                  onClick={handleCreateDevotional}
                  disabled={submitting}
                  className="flex items-center gap-2 bible-card-sunset font-medium text-sm disabled:opacity-50"
                  style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? "Creando..." : "Crear"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {devotionals.length === 0 ? (
            <div className="col-span-2 bible-glass-card flex flex-col items-center justify-center py-14 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-400/10 mb-4">
                <BookOpen className="w-6 h-6 text-orange-400/40" />
              </div>
              <p className="text-muted-foreground">Aún no tienes devocionales.</p>
              <p className="text-sm text-muted-foreground">¡Crea el primero!</p>
            </div>
          ) : (
            devotionals.map((devotional) => (
              <div key={devotional.id} className="bible-glass-card p-0 border-l-4 border-l-orange-400 overflow-hidden">
                <div className="p-5">
                  {/* Title row */}
                  <div className="flex justify-between items-start gap-2 mb-3">
                    {editingId === devotional.id ? (
                      <Input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="text-base font-semibold"
                      />
                    ) : (
                      <h3
                        className="text-base font-semibold leading-snug cursor-pointer hover:text-orange-400 transition-colors"
                        onClick={() => navigate(`/devotionals/${devotional.id}`)}
                      >
                        {devotional.title}
                      </h3>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      {editingId === devotional.id ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleUpdateDevotional(devotional.id)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/devotionals/${devotional.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => startEditing(devotional)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDevotional(devotional.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  {editingId === devotional.id ? (
                    <Textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p
                      className="text-sm text-muted-foreground leading-relaxed cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => navigate(`/devotionals/${devotional.id}`)}
                    >
                      {devotional.content.length > 120
                        ? devotional.content.substring(0, 120) + "..."
                        : devotional.content}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <span className="text-xs text-muted-foreground">
                      {devotional.user.username}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(devotional.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Devotionals;
