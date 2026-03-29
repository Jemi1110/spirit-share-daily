import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, Edit2, Trash2, Save, X, Eye } from "lucide-react";
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
      console.error('Error loading devotionals:', error);
      toast.error('Failed to load devotionals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevotional = async () => {
    if (!newDevotional.title.trim() || !newDevotional.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await devotionalAPI.create(newDevotional);
      setNewDevotional({ title: "", content: "" });
      setIsDialogOpen(false);
      toast.success('Devotional created successfully!');
      loadDevotionals();
    } catch (error) {
      console.error('Error creating devotional:', error);
      toast.error('Failed to create devotional');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevotional = async (id: string) => {
    if (!confirm('Are you sure you want to delete this devotional?')) return;

    try {
      await devotionalAPI.delete(id);
      toast.success('Devotional deleted successfully!');
      loadDevotionals();
    } catch (error) {
      console.error('Error deleting devotional:', error);
      toast.error('Failed to delete devotional');
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
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await devotionalAPI.update(id, editForm);
      toast.success('Devotional updated successfully!');
      setEditingId(null);
      setEditForm({ title: "", content: "" });
      loadDevotionals();
    } catch (error) {
      console.error('Error updating devotional:', error);
      toast.error('Failed to update devotional');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading devotionals...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-spiritual">My Devotionals</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-devotional hover:bg-devotional/90">
                <Plus className="h-4 w-4 mr-2" />
                New Devotional
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Devotional</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newDevotional.title}
                    onChange={(e) => setNewDevotional({ ...newDevotional, title: e.target.value })}
                    placeholder="Enter devotional title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newDevotional.content}
                    onChange={(e) => setNewDevotional({ ...newDevotional, content: e.target.value })}
                    placeholder="Write your devotional..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-devotional hover:bg-devotional/90" 
                  onClick={handleCreateDevotional}
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {devotionals.length === 0 ? (
            <div className="col-span-2 text-center py-8">
              <p className="text-muted-foreground">No devotionals yet. Create your first one!</p>
            </div>
          ) : (
            devotionals.map((devotional) => (
              <div key={devotional.id} className="bible-glass-card border-l-4 border-l-devotional">
                <div className="p-6 pb-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-devotional mt-1" />
                      {editingId === devotional.id ? (
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="text-lg font-semibold"
                        />
                      ) : (
                        <span>{devotional.title}</span>
                      )}
                    </h3>
                    <div className="flex gap-2">
                      {editingId === devotional.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateDevotional(devotional.id)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/devotionals/${devotional.id}`)}
                            title="View full devotional"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(devotional)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDevotional(devotional.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-2">
                  {editingId === devotional.id ? (
                    <Textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/devotionals/${devotional.id}`)}
                    >
                      <p className="text-muted-foreground mb-3 hover:text-foreground transition-colors">
                        {devotional.content.length > 150
                          ? devotional.content.substring(0, 150) + '...'
                          : devotional.content}
                      </p>
                      <p className="text-sm text-spiritual hover:underline">
                        Read more →
                      </p>
                    </div>
                  )}
                  <p className="text-sm font-medium text-spiritual mt-3">By {devotional.user.username}</p>
                </div>
                <div className="px-6 pb-6">
                  <p className="text-xs text-muted-foreground">{formatDate(devotional.created_at)}</p>
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
