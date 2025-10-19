import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen } from "lucide-react";

const Devotionals = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDevotional, setNewDevotional] = useState({ title: "", content: "", verse: "" });

  // Mock devotionals
  const devotionals = [
    {
      id: 1,
      title: "Walking in Faith",
      preview: "Today we explore what it means to trust God completely...",
      verse: "Proverbs 3:5-6",
      date: "March 15, 2024"
    },
    {
      id: 2,
      title: "Love and Compassion",
      preview: "Discovering the depth of God's love through serving others...",
      verse: "1 Corinthians 13:4-7",
      date: "March 14, 2024"
    }
  ];

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
                  <Label htmlFor="verse">Related Verse</Label>
                  <Input
                    id="verse"
                    value={newDevotional.verse}
                    onChange={(e) => setNewDevotional({ ...newDevotional, verse: e.target.value })}
                    placeholder="e.g., John 3:16"
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
                <Button className="bg-devotional hover:bg-devotional/90" onClick={() => setIsDialogOpen(false)}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {devotionals.map((devotional) => (
            <Card key={devotional.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-devotional">
              <CardHeader>
                <CardTitle className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-devotional mt-1" />
                  <span>{devotional.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{devotional.preview}</p>
                <p className="text-sm font-medium text-spiritual">{devotional.verse}</p>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">{devotional.date}</p>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Devotionals;
