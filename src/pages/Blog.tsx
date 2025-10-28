import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PenTool, Edit2, Trash2, Save, X, Eye } from "lucide-react";
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
      console.log('Loading blog articles...');
      const data = await blogAPI.getAll();
      console.log('Blog articles loaded:', data);
      setArticles(data as BlogArticle[]);
    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!newArticle.title.trim() || !newArticle.content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await blogAPI.create(newArticle);
      setNewArticle({ title: "", content: "" });
      setIsDialogOpen(false);
      toast.success('Article published successfully!');
      loadArticles();
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Failed to publish article');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      await blogAPI.delete(id);
      toast.success('Article deleted successfully!');
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('Failed to delete article');
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
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await blogAPI.update(id, editForm);
      toast.success('Article updated successfully!');
      setEditingId(null);
      setEditForm({ title: "", content: "" });
      loadArticles();
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('Failed to update article');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading articles...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-spiritual">Blog & Reflections</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-spiritual hover:bg-spiritual/90">
                <Plus className="h-4 w-4 mr-2" />
                Write Article
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Write New Article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="article-title">Title</Label>
                  <Input
                    id="article-title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    placeholder="Enter article title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="article-content">Content</Label>
                  <Textarea
                    id="article-content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    placeholder="Share your thoughts and reflections..."
                    className="min-h-[300px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-spiritual hover:bg-spiritual/90" 
                  onClick={handleCreateArticle}
                  disabled={submitting}
                >
                  {submitting ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {articles.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No articles yet. Write your first one!</p>
              </CardContent>
            </Card>
          ) : (
            articles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-start gap-2 text-xl">
                      <PenTool className="h-5 w-5 text-spiritual mt-1" />
                      {editingId === article.id ? (
                        <Input
                          value={editForm.title}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="text-xl font-semibold"
                        />
                      ) : (
                        <span>{article.title}</span>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      {editingId === article.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateArticle(article.id)}
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
                            onClick={() => navigate(`/blog/${article.id}`)}
                            title="View full article"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(article)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingId === article.id ? (
                    <Textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                      className="min-h-[200px]"
                    />
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-4">
                        {article.content.length > 200 
                          ? article.content.substring(0, 200) + '...' 
                          : article.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{article.user.username}</span>
                        <span>•</span>
                        <span>{formatDate(article.created_at)}</span>
                        <span>•</span>
                        <span>{getReadTime(article.content)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
                {editingId !== article.id && (
                  <CardFooter>
                    <Button 
                      variant="ghost" 
                      className="text-spiritual hover:text-spiritual/90"
                      onClick={() => navigate(`/blog/${article.id}`)}
                    >
                      Read More →
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
