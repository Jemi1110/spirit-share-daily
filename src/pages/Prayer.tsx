import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Users, Trash2 } from "lucide-react";
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
      console.error('Error loading prayer requests:', error);
      toast.error('Failed to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.title.trim()) {
      toast.error('Please enter a title for your prayer request');
      return;
    }

    setSubmitting(true);
    try {
      await prayerAPI.create({
        title: newRequest.title,
        description: newRequest.description,
        is_anonymous: false
      });
      setNewRequest({ title: "", description: "" });
      setIsDialogOpen(false);
      toast.success('Prayer request shared successfully!');
      loadPrayerRequests();
    } catch (error) {
      console.error('Error creating prayer request:', error);
      toast.error('Failed to share prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePray = async (id: string) => {
    try {
      await prayerAPI.markPrayed(id);
      toast.success('Thank you for praying!');
      loadPrayerRequests(); // Reload to update prayer count
    } catch (error) {
      console.error('Error marking as prayed:', error);
      toast.error('Failed to mark as prayed');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prayer request?')) return;

    try {
      await prayerAPI.delete(id);
      toast.success('Prayer request deleted successfully!');
      loadPrayerRequests();
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      toast.error('Failed to delete prayer request');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">Loading prayer requests...</div>
        </div>
      </Layout>
    );
  }

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
                <Button 
                  className="bg-prayer hover:bg-prayer/90" 
                  onClick={handleCreateRequest}
                  disabled={submitting}
                >
                  {submitting ? 'Sharing...' : 'Share Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No prayer requests yet. Share the first one!</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-prayer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg mb-1">{request.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        by {request.user.username} • {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.is_answered && (
                        <Badge className="bg-accent text-accent-foreground">Answered</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRequest(request.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{request.description}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{request.prayer_count} people prayed</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="gap-2 border-prayer text-prayer hover:bg-prayer hover:text-prayer-foreground"
                    onClick={() => handlePray(request.id)}
                  >
                    <Heart className="h-4 w-4" />
                    I Prayed
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Prayer;
