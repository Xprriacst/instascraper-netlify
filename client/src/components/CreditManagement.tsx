import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";

export default function CreditManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  const handlePurchaseCredits = () => {
    setLocation("/subscribe");
  };

  const creditPercentage = stats && stats.totalCredits > 0 ? (stats.usedCredits / stats.totalCredits) * 100 : 0;
  const daysUntilReset = 12; // This would come from backend calculation

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8" data-testid="credit-management">
      
      {/* Credit Usage Chart */}
      <Card data-testid="card-credit-usage">
        <CardHeader>
          <CardTitle>Utilisation des Crédits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Crédits utilisés ce mois</span>
            <span className="text-sm font-medium text-card-foreground" data-testid="text-credits-used">
              {stats?.usedCredits || 0} / {stats?.totalCredits || 0}
            </span>
          </div>
          
          <Progress value={creditPercentage} className="h-3" data-testid="progress-credits" />
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600" data-testid="text-remaining-credits">
                {stats?.remainingCredits || 0}
              </p>
              <p className="text-sm text-muted-foreground">Restants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-card-foreground" data-testid="text-days-until-reset">
                {daysUntilReset}j
              </p>
              <p className="text-sm text-muted-foreground">Jusqu'au reset</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Upgrade */}
      <Card data-testid="card-billing">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestion des Crédits</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <i className="fas fa-credit-card"></i>
              <span data-testid="text-plan">Plan Standard</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4" data-testid="pricing-card">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">Pack de Crédits</h4>
              <span className="text-xl font-bold text-blue-900" data-testid="text-price">5€</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">50 requêtes de scraping</p>
            <div className="text-xs text-blue-600">
              <p>• Données exportées en Excel/CSV</p>
              <p>• Support technique inclus</p>
              <p>• Facturation mensuelle</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg" data-testid="auto-renewal">
            <div>
              <p className="font-medium text-card-foreground">Renouvellement automatique</p>
              <p className="text-sm text-muted-foreground">Le 15 de chaque mois</p>
            </div>
            <Switch 
              defaultChecked={user?.autoRenewal || false}
              data-testid="switch-auto-renewal" 
            />
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={handlePurchaseCredits}
              className="flex-1"
              data-testid="button-purchase-credits"
            >
              <i className="fas fa-plus mr-2"></i>
              Acheter des Crédits
            </Button>
            <Button 
              variant="outline"
              data-testid="button-view-billing"
            >
              <i className="fas fa-receipt"></i>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
