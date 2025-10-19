import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Users } from "lucide-react";

const Prayer = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: "", description: "" });

  // Mock prayer requests
  const requests = [
    {
      id: 1,
      user: "John Doe",
      title: "Healing for my mother",
      description: "Please pray for my mother's recovery from surgery",
      prayerCount: 34,
      answered: false,
      date: "2 days ago"
    },
    {
      id: 2,
      user: "Mary Smith",
      title: "Job interview guidance",
      description: "Seeking God's wisdom for an important interview tomorrow",
      prayerCount: 18,
      answered: false,
      date: "1 day ago"
    },
    {
      id: 3,
      user: "David Johnson",
      title: "Marriage restoration",
      description: "Praying for healing and restoration in my marriage",
      prayerCount: 56,
      answered: true,
      date: "1 week ago"
    }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-prayer">Prayer Wall</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-prayer hover:bg-prayer/90">
                <Plus className="h-4 w-4 mr-2" />
                Share Prayer Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share Your Prayer Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="prayer-title">Title</Label>
                  <Input
                    id="prayer-title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    placeholder="What do you need prayer for?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prayer-description">Description</Label>
                  <Textarea
                    id="prayer-description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    placeholder="Share more details (optional)"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-prayer hover:bg-prayer/90" onClick={() => setIsDialogOpen(false)}>
                  Share Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-prayer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg mb-1">{request.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      by {request.user} • {request.date}
                    </p>
                  </div>
                  {request.answered && (
                    <Badge className="bg-accent text-accent-foreground">Answered</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{request.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{request.prayerCount} people prayed</span>
                </div>
                <Button variant="outline" className="gap-2 border-prayer text-prayer hover:bg-prayer hover:text-prayer-foreground">
                  <Heart className="h-4 w-4" />
                  I Prayed
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Prayer;
