import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Trash2, Save, X, BookOpen, Calendar, User } from "lucide-react";
import { devotionalAPI, userAPI } from "@/services/api";
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

interface User {
  id: number;
  username: string;
  email: string;
}

const DevotionalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  useEffect(() => {
    if (id) {
      loadDevotional();
      loadCurrentUser();
    }
  }, [id]);

  const loadDevotional = async () => {
    if (!id) return;
    
    try {
      const data = await devotionalAPI.getById(id);
      const devotionalData = data as Devotional;
      setDevotional(devotionalData);
      setEditForm({ title: devotionalData.title, content: devotionalData.content });
    } catch (error) {
      console.error('Error loading devotional:', error);
      toast.error('Failed to load devotional');
      navigate('/devotionals');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const userData = await userAPI.getProfile();
      setCurrentUser(userData as User);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    if (devotional) {
      setEditForm({ title: devotional.title, content: devotional.content });
    }
  };

  const handleSave = async () => {
    if (!devotional || !editForm.title.trim() || !editForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await devotionalAPI.update(devotional.id, editForm);
      toast.success('Devotional updated successfully!');
      setEditing(false);
      loadDevotional(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating devotional:', error);
      toast.error('Failed to update devotional');
    }
  };

  const handleDelete = async () => {
    if (!devotional) return;
    
    if (!confirm('Are you sure you want to delete this devotional?')) return;

    try {
      await devotionalAPI.delete(devotional.id);
      toast.success('Devotional deleted successfully!');
      navigate('/devotionals');
    } catch (error) {
      console.error('Error deleting devotional:', error);
      toast.error('Failed to delete devotional');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const canEdit = currentUser && devotional && currentUser.id === devotional.user.id;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading devotional...</div>
        </div>
      </Layout>
    );
  }

  if (!devotional) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bible-glass-card">
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Devotional not found</p>
              <Button
                onClick={() => navigate('/devotionals')}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Devotionals
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            onClick={() => navigate('/devotionals')} 
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Devotionals
          </Button>
          
          {canEdit && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button onClick={handleCancelEdit} variant="outline" className="gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleEdit} variant="outline" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    onClick={handleDelete} 
                    variant="outline" 
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Devotional Content */}
        <div className="bible-glass-card border-l-4 border-l-devotional">
          <div className="p-6 pb-0">
            <div className="space-y-4">
              {editing ? (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="text-3xl font-bold bg-transparent border-none outline-none w-full text-devotional"
                  placeholder="Devotional title..."
                />
              ) : (
                <h3 className="text-3xl font-bold text-devotional flex items-center gap-3">
                  <BookOpen className="h-8 w-8" />
                  {devotional.title}
                </h3>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By {devotional.user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(devotional.created_at)}</span>
                </div>
                {devotional.updated_at !== devotional.created_at && (
                  <Badge variant="outline">
                    Updated {formatDate(devotional.updated_at)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 pt-2">
            {editing ? (
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                className="min-h-[400px] text-lg leading-relaxed resize-none"
                placeholder="Write your devotional content..."
              />
            ) : (
              <div className="prose prose-lg max-w-none">
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {devotional.content}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Actions */}
        {!editing && (
          <div className="bible-glass-card">
            <div className="p-6">
              <h4 className="font-semibold mb-4">Share Your Thoughts</h4>
              <p className="text-sm text-muted-foreground mb-4">
                How did this devotional speak to you? Share your reflections with the community.
              </p>
              <div className="flex gap-2">
                <Button className="bg-spiritual hover:bg-spiritual/90">
                  Add Reflection (Coming Soon)
                </Button>
                <Button variant="outline">
                  Share Devotional (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DevotionalDetail;