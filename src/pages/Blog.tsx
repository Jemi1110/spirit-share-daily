import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, PenTool } from "lucide-react";

const Blog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "" });

  // Mock blog articles
  const articles = [
    {
      id: 1,
      title: "Finding Peace in Troubled Times",
      excerpt: "In a world full of chaos, discovering God's peace is essential...",
      author: "Sarah Johnson",
      date: "March 16, 2024",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "The Power of Community Prayer",
      excerpt: "When believers come together in prayer, miracles happen...",
      author: "Michael Chen",
      date: "March 14, 2024",
      readTime: "7 min read"
    },
    {
      id: 3,
      title: "Understanding Grace Through Scripture",
      excerpt: "A deep dive into what the Bible teaches about God's amazing grace...",
      author: "David Wilson",
      date: "March 12, 2024",
      readTime: "10 min read"
    }
  ];

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
                <Button className="bg-spiritual hover:bg-spiritual/90" onClick={() => setIsDialogOpen(false)}>
                  Publish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-start gap-2 text-xl">
                  <PenTool className="h-5 w-5 text-spiritual mt-1" />
                  <span>{article.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{article.author}</span>
                  <span>•</span>
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="text-spiritual hover:text-spiritual/90">
                  Read More →
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
