import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";

export default function StatsCards() {
  const { user } = useAuth();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="stats-loading">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" data-testid="stats-cards">
      <Card className="p-6" data-testid="card-active-campaigns">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-play text-blue-600"></i>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">Campagnes Actives</p>
            <p className="text-2xl font-semibold text-card-foreground" data-testid="text-active-campaigns">
              {stats?.activeCampaigns || 0}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-completed-campaigns">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">Terminées ce mois</p>
            <p className="text-2xl font-semibold text-card-foreground" data-testid="text-completed-campaigns">
              {stats?.completedCampaigns || 0}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-credits-used">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-coins text-yellow-600"></i>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">Crédits Utilisés</p>
            <p className="text-2xl font-semibold text-card-foreground">
              <span data-testid="text-used-credits">{stats?.usedCredits || 0}</span>
              <span className="text-sm text-muted-foreground font-normal">/ {stats?.totalCredits || 0}</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
