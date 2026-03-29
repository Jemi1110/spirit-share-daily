import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Trash2, Save, X, PenTool, Calendar, User, Clock } from "lucide-react";
import { blogAPI, userAPI } from "@/services/api";
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

interface User {
  id: number;
  username: string;
  email: string;
}

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "" });

  useEffect(() => {
    if (id) {
      loadArticle();
      loadCurrentUser();
    }
  }, [id]);

  const loadArticle = async () => {
    if (!id) return;
    
    try {
      const data = await blogAPI.getById(id);
      const articleData = data as BlogArticle;
      setArticle(articleData);
      setEditForm({ title: articleData.title, content: articleData.content });
    } catch (error) {
      console.error('Error loading article:', error);
      toast.error('Failed to load article');
      navigate('/blog');
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
    if (article) {
      setEditForm({ title: article.title, content: article.content });
    }
  };

  const handleSave = async () => {
    if (!article || !editForm.title.trim() || !editForm.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await blogAPI.update(article.id, editForm);
      toast.success('Article updated successfully!');
      setEditing(false);
      loadArticle(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await blogAPI.delete(article.id);
      toast.success('Article deleted successfully!');
      navigate('/blog');
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const canEdit = currentUser && article && currentUser.id === article.user.id;

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading article...</div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bible-glass-card">
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Article not found</p>
              <Button
                onClick={() => navigate('/blog')}
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
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
            onClick={() => navigate('/blog')} 
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
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

        {/* Article Content */}
        <div className="bible-glass-card">
          <div className="p-6 pb-0">
            <div className="space-y-4">
              {editing ? (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                  className="text-3xl font-bold bg-transparent border-none outline-none w-full text-spiritual"
                  placeholder="Article title..."
                />
              ) : (
                <h3 className="text-3xl font-bold text-spiritual flex items-center gap-3">
                  <PenTool className="h-8 w-8" />
                  {article.title}
                </h3>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>By {article.user.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{getReadTime(article.content)}</span>
                </div>
                {article.updated_at !== article.created_at && (
                  <Badge variant="outline">
                    Updated {formatDate(article.updated_at)}
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
                className="min-h-[500px] text-lg leading-relaxed resize-none"
                placeholder="Write your article content..."
              />
            ) : (
              <div className="prose prose-lg max-w-none">
                <div className="text-lg leading-relaxed whitespace-pre-wrap">
                  {article.content}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Actions */}
        {!editing && (
          <div className="bible-glass-card">
            <div className="p-6">
              <h4 className="font-semibold mb-4">Engage with this Article</h4>
              <p className="text-sm text-muted-foreground mb-4">
                What are your thoughts on this article? Join the conversation.
              </p>
              <div className="flex gap-2">
                <Button className="bg-spiritual hover:bg-spiritual/90">
                  Add Comment (Coming Soon)
                </Button>
                <Button variant="outline">
                  Share Article (Coming Soon)
                </Button>
                <Button variant="outline">
                  Save for Later (Coming Soon)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BlogDetail;