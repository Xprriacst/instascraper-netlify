import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

const campaignSchema = z.object({
  hashtag: z.string().min(1, "Le hashtag est requis").max(50, "Le hashtag ne peut pas dépasser 50 caractères"),
  requestCount: z.number().min(1, "Au moins 1 requête est nécessaire").max(300, "Maximum 300 requêtes"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export default function CampaignForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      hashtag: "",
      requestCount: 50,
    },
  });

  const requestCount = watch("requestCount");

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await apiRequest("POST", "/api/campaigns", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Campagne lancée",
        description: "Votre campagne de scraping a été démarrée avec succès.",
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        return;
      }
      
      toast({
        title: "Erreur",
        description: error.message || "Impossible de lancer la campagne",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    if (!user?.credits || user.credits < data.requestCount) {
      toast({
        title: "Crédits insuffisants",
        description: "Vous n'avez pas assez de crédits pour cette campagne.",
        variant: "destructive",
      });
      return;
    }

    createCampaignMutation.mutate(data);
  };

  return (
    <Card data-testid="campaign-form">
      <CardHeader className="border-b border-border">
        <CardTitle>Nouvelle Campagne</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">Configurez votre campagne de scraping Instagram</p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="hashtag" className="block text-sm font-medium text-card-foreground mb-2">
              Hashtag à scraper
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-hashtag text-muted-foreground"></i>
              </div>
              <Input
                id="hashtag"
                type="text"
                className="pl-10"
                placeholder="travel, food, fashion..."
                {...register("hashtag")}
                data-testid="input-hashtag"
              />
            </div>
            {errors.hashtag && (
              <p className="text-sm text-red-500 mt-1" data-testid="error-hashtag">{errors.hashtag.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="requests" className="block text-sm font-medium text-card-foreground mb-2">
              Nombre de requêtes
            </Label>
            <div className="relative">
              <Input
                id="requests"
                type="number"
                min="1"
                max="300"
                className="pr-16"
                placeholder="50"
                {...register("requestCount", { valueAsNumber: true })}
                data-testid="input-requests"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground text-sm">/ {user?.credits || 0}</span>
              </div>
            </div>
            {errors.requestCount && (
              <p className="text-sm text-red-500 mt-1" data-testid="error-requests">{errors.requestCount.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Crédits disponibles: <span className="font-medium" data-testid="text-available-credits">{user?.credits || 0}</span>
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border" data-testid="info-box">
            <div className="flex items-start space-x-3">
              <i className="fas fa-info-circle text-blue-500 mt-0.5"></i>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-card-foreground mb-1">Configuration recommandée</p>
                <p>Pour de meilleurs résultats, limitez vos requêtes à 100 par campagne et utilisez des hashtags spécifiques.</p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={createCampaignMutation.isPending || !user?.credits || user.credits < requestCount}
            className="w-full"
            data-testid="button-launch-campaign"
          >
            {createCampaignMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Lancement en cours...
              </>
            ) : (
              <>
                <i className="fas fa-rocket mr-2"></i>
                Lancer la Campagne
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
