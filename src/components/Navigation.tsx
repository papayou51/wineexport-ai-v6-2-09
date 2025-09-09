import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, Grape } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Don't render navigation for authenticated users
  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-wine-deep to-wine-medium rounded-lg">
                <Grape className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-foreground">WineExport</span>
                <span className="text-xl font-bold bg-gradient-to-r from-wine-deep to-wine-medium bg-clip-text text-transparent"> AI</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (user) {
    return null; // AuthenticatedNavigation will be used instead
  }

  const navItems = [
    { label: "Fonctionnalités", href: "#features" },
    { label: "Tarifs", href: "#pricing" },
    { label: "Documentation", href: "#docs" },
    { label: "Contact", href: "#contact" }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-wine-deep to-wine-medium rounded-lg">
              <Grape className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-foreground">WineExport</span>
              <span className="text-xl font-bold bg-gradient-to-r from-wine-deep to-wine-medium bg-clip-text text-transparent"> AI</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/auth/login">
              <Button variant="ghost">
                Connexion
              </Button>
            </Link>
            <Link to="/auth/register">
              <Button>
                Commencer gratuitement
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col space-y-2 pt-4">
                <Link to="/auth/login">
                  <Button variant="ghost" className="justify-start w-full">
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button className="justify-start w-full">
                    Commencer gratuitement
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;