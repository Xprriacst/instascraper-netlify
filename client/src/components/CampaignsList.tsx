import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  hashtag: string;
  requestCount: number;
  completedRequests: number;
  status: string;
  createdAt: string;
  apifyRunId?: string;
}

export default function CampaignsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');

  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
    enabled: !!user,
  });

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns?.filter(campaign => {
    switch (activeFilter) {
      case 'active':
        return campaign.status === 'running' || campaign.status === 'pending';
      case 'completed':
        return campaign.status === 'completed' || campaign.status === 'failed';
      default:
        return true;
    }
  }) || [];

  const checkStatusMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await apiRequest("POST", `/api/campaigns/${campaignId}/check-status`);
      return response.json();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  // Auto-check status for running campaigns every 30 seconds
  useEffect(() => {
    if (!campaigns) return;

    const runningCampaigns = campaigns.filter(c => c.status === 'running');
    if (runningCampaigns.length === 0) return;

    const interval = setInterval(() => {
      runningCampaigns.forEach(campaign => {
        checkStatusMutation.mutate(campaign.id);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [campaigns, checkStatusMutation]);

  const downloadFile = async (campaignId: string, format: 'excel' | 'csv' = 'excel') => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/download?format=${format}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Parse filename from Content-Disposition header correctly
      let filename = `campaign_${campaignId}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Téléchargement réussi",
        description: "Votre fichier a été téléchargé avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur de téléchargement",
        description: error.message || "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" data-testid="badge-pending"><i className="fas fa-clock mr-1"></i>En attente</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800" data-testid="badge-running"><i className="fas fa-clock mr-1"></i>En cours</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800" data-testid="badge-completed"><i className="fas fa-check-circle mr-1"></i>Terminée</Badge>;
      case 'failed':
        return <Badge variant="destructive" data-testid="badge-failed"><i className="fas fa-times-circle mr-1"></i>Échec</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProgress = (campaign: Campaign) => {
    if (campaign.status === 'completed') return 100;
    if (campaign.status === 'failed' || campaign.status === 'pending') return 0;
    return Math.round((campaign.completedRequests / campaign.requestCount) * 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Il y a moins d'1 heure";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  if (isLoading) {
    return (
      <Card data-testid="campaigns-loading">
        <CardHeader className="border-b border-border">
          <CardTitle>Mes Campagnes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="campaigns-list">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle>Mes Campagnes</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant={activeFilter === 'all' ? 'default' : 'ghost'} 
              size="sm" 
              data-testid="filter-all"
              onClick={() => setActiveFilter('all')}
            >
              Toutes
            </Button>
            <Button 
              variant={activeFilter === 'active' ? 'default' : 'ghost'} 
              size="sm" 
              data-testid="filter-active"
              onClick={() => setActiveFilter('active')}
            >
              Actives
            </Button>
            <Button 
              variant={activeFilter === 'completed' ? 'default' : 'ghost'} 
              size="sm" 
              data-testid="filter-completed"
              onClick={() => setActiveFilter('completed')}
            >
              Terminées
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {!campaigns || campaigns.length === 0 ? (
          <div className="p-8 text-center" data-testid="no-campaigns">
            <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">Aucune campagne</h3>
            <p className="text-muted-foreground">Créez votre première campagne de scraping pour commencer.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Campagne
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      Aucune campagne {activeFilter === 'active' ? 'active' : activeFilter === 'completed' ? 'terminée' : ''} trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-muted/30 transition-colors" data-testid={`campaign-row-${campaign.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <i className="fas fa-hashtag text-blue-600"></i>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-card-foreground" data-testid={`text-hashtag-${campaign.id}`}>
                            #{campaign.hashtag}
                          </div>
                          <div className="text-sm text-muted-foreground" data-testid={`text-date-${campaign.id}`}>
                            {formatDate(campaign.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-full mr-3">
                          <Progress 
                            value={getProgress(campaign)} 
                            className="h-2"
                            data-testid={`progress-${campaign.id}`}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground" data-testid={`text-progress-${campaign.id}`}>
                          {campaign.completedRequests}/{campaign.requestCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {campaign.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => downloadFile(campaign.id, 'excel')}
                              data-testid={`button-download-${campaign.id}`}
                            >
                              <i className="fas fa-download mr-1"></i>
                              Télécharger
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadFile(campaign.id, 'csv')}
                              data-testid={`button-download-csv-${campaign.id}`}
                            >
                              CSV
                            </Button>
                          </>
                        )}
                        {campaign.status === 'running' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => checkStatusMutation.mutate(campaign.id)}
                            disabled={checkStatusMutation.isPending}
                            data-testid={`button-check-status-${campaign.id}`}
                          >
                            <i className="fas fa-sync-alt mr-1"></i>
                            Vérifier
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
