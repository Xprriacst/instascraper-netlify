import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              <i className="fas fa-chart-line text-primary mr-4"></i>
              ScrapeFlow
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Plateforme professionnelle de scraping Instagram avec Apify. 
              Collectez des données précises, gérez vos crédits et exportez facilement.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="feature-scraping">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-primary text-xl"></i>
                </div>
                <CardTitle>Scraping Avancé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Utilisez l'API Apify pour collecter des données Instagram de haute qualité par hashtags.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="feature-credits">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-coins text-primary text-xl"></i>
                </div>
                <CardTitle>Système de Crédits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Payez uniquement pour ce que vous utilisez. 50 requêtes pour 5€/mois.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors" data-testid="feature-export">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-file-export text-primary text-xl"></i>
                </div>
                <CardTitle>Export Facile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Exportez vos données en Excel ou CSV en un clic pour vos analyses.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-md mx-auto border-2 border-primary/20 bg-card" data-testid="login-card">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Commencez maintenant</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Connectez-vous pour accéder à votre tableau de bord et lancer votre première campagne.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="w-full"
                size="lg"
                data-testid="button-login"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Se connecter
              </Button>
            </CardContent>
          </Card>

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              <i className="fas fa-shield-alt text-green-500 mr-2"></i>
              Conforme RGPD • Données sécurisées • Support technique inclus
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
