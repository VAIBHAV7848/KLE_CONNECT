import PageLayout from "@/components/layout/PageLayout";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PageLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="text-8xl font-bold font-display mb-4 text-gradient">
            404
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Page Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default NotFound;
