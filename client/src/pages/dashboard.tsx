import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StatsCards from "@/components/StatsCards";
import CampaignForm from "@/components/CampaignForm";
import CampaignsList from "@/components/CampaignsList";
import CreditManagement from "@/components/CreditManagement";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-dashboard">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="dashboard-container">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary" data-testid="text-logo">
                  <i className="fas fa-chart-line mr-2"></i>
                  ScrapeFlow
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <i className="fas fa-coins text-yellow-500"></i>
                <span className="font-medium text-foreground" data-testid="text-credits">-</span>
                <span>crédits restants</span>
              </div>
              
              <button 
                onClick={() => window.location.href = '/api/logout'}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-logout"
              >
                <i className="fas fa-sign-out-alt mr-1"></i>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted/30" data-testid="main-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Stats Cards */}
          <StatsCards />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Campaign Form */}
            <div className="xl:col-span-1">
              <CampaignForm />
            </div>

            {/* Campaigns List */}
            <div className="xl:col-span-2">
              <CampaignsList />
            </div>
          </div>

          {/* Credit Management */}
          <CreditManagement />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border" data-testid="footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <p className="text-sm text-muted-foreground">© 2024 ScrapeFlow. Tous droits réservés.</p>
              <div className="flex items-center space-x-4">
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">API</a>
                <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Conditions</a>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <i className="fas fa-shield-alt text-green-500"></i>
              <span>Conforme RGPD</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
