import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, PenTool, Users } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in, otherwise redirect to auth
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate("/feed");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-spiritual-light via-background to-prayer-light">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <BookOpen className="h-20 w-20 text-spiritual" />
          </div>
          <h1 className="text-6xl font-bold text-spiritual mb-4">Bibly</h1>
          <p className="text-2xl text-muted-foreground mb-8">
            Connect with God and Community Through Scripture
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-spiritual hover:bg-spiritual/90 text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-primary text-primary hover:bg-primary hover:text-white flex items-center gap-2"
              onClick={() => navigate("/preview")}
            >
              <PenTool className="w-5 h-5" />
              New Design Preview
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-16">
          <div className="bg-card p-6 rounded-lg border border-border text-center">
            <BookOpen className="h-12 w-12 text-spiritual mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Bible Reading</h3>
            <p className="text-muted-foreground text-sm">
              Read, highlight, and share verses with personalized notes
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border border-border text-center">
            <PenTool className="h-12 w-12 text-devotional mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Devotionals</h3>
            <p className="text-muted-foreground text-sm">
              Create and share personal devotionals with the community
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border border-border text-center">
            <Heart className="h-12 w-12 text-prayer mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Prayer Wall</h3>
            <p className="text-muted-foreground text-sm">
              Share requests and pray for others in community
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border border-border text-center">
            <Users className="h-12 w-12 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Community</h3>
            <p className="text-muted-foreground text-sm">
              Connect with believers and grow together in faith
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
