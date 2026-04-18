import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Plus, Users, Trash2, Loader2 } from "lucide-react";
import { prayerAPI } from "@/services/api";
import { toast } from "sonner";

interface PrayerRequest {
  id: string;
  title: string;
  description: string;
  is_answered: boolean;
  prayer_count: number;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
}

const Prayer = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", description: "" });
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPrayerRequests();
  }, []);

  const loadPrayerRequests = async () => {
    try {
      const data = await prayerAPI.getAll();
      setRequests(data as PrayerRequest[]);
    } catch (error) {
      toast.error("No se pudieron cargar las peticiones");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.title.trim()) {
      toast.error("Por favor escribe un título");
      return;
    }
    setSubmitting(true);
    try {
      await prayerAPI.create({
        title: newRequest.title,
        description: newRequest.description,
        is_anonymous: false,
      });
      setNewRequest({ title: "", description: "" });
      setIsDialogOpen(false);
      toast.success("¡Petición compartida!");
      loadPrayerRequests();
    } catch (error) {
      toast.error("No se pudo compartir la petición");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (id: string) => {
    try {
      await prayerAPI.markPrayed(id);
      toast.success("¡Gracias por orar!");
      loadPrayerRequests();
    } catch (error) {
      toast.error("No se pudo registrar la oración");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("¿Eliminar esta petición?")) return;
    try {
      await prayerAPI.delete(id);
      toast.success("Petición eliminada");
      loadPrayerRequests();
    } catch (error) {
      toast.error("No se pudo eliminar");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Hace un momento";
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    if (diffInHours < 48) return "Ayer";
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
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
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/20">
              <Heart className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold">Muro de Oración</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 bg-purple-500/20 border border-purple-400/20 rounded-xl px-4 py-2 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all">
                <Plus className="w-4 h-4" />
                Compartir
              </button>
            </DialogTrigger>
            <DialogContent className="border-purple-400/20">
              <DialogHeader>
                <DialogTitle className="text-purple-400">Compartir Petición de Oración</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="prayer-title" className="text-muted-foreground text-sm">Título</Label>
                  <Input
                    id="prayer-title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    placeholder="¿Por qué necesitas oración?"
                    className="bg-white/5 border-white/10 focus-visible:ring-purple-400/30 focus-visible:border-purple-400/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prayer-description" className="text-muted-foreground text-sm">Descripción</Label>
                  <Textarea
                    id="prayer-description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    placeholder="Comparte más detalles (opcional)"
                    className="min-h-[100px] bg-white/5 border-white/10 focus-visible:ring-purple-400/30 focus-visible:border-purple-400/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <button
                  onClick={handleCreateRequest}
                  disabled={submitting}
                  className="flex items-center gap-2 bible-card-purple font-medium text-sm disabled:opacity-50"
                  style={{ borderRadius: "0.75rem", padding: "0.5rem 1rem" }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? "Compartiendo..." : "Compartir"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards */}
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="bible-glass-card flex flex-col items-center justify-center py-14 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-400/10 mb-4">
                <Heart className="w-6 h-6 text-purple-400/40" />
              </div>
              <p className="text-muted-foreground">No hay peticiones todavía.</p>
              <p className="text-sm text-muted-foreground">¡Sé el primero en compartir!</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bible-glass-card p-0 border-l-4 border-l-purple-400 overflow-hidden">
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold leading-snug">{request.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {request.user.username} · {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {request.is_answered && (
                        <span className="text-xs bg-emerald-500/20 border border-emerald-400/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          Respondida
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  {request.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {request.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{request.prayer_count} personas oraron</span>
                    </div>
                    <button
                      onClick={() => handlePray(request.id)}
                      className="flex items-center gap-2 bg-purple-500/20 border border-purple-400/20 rounded-full px-4 py-1.5 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-all"
                    >
                      <Heart className="h-4 w-4" />
                      Oré
                    </button>
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

export default Prayer;
