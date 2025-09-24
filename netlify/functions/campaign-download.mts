import type { Context, Config } from "@netlify/functions";
import { storage } from "../../server/storage";
import { requireAuth } from "../../server/netlifyAuth";
import { exportService } from "../../server/services/exportService";

export default requireAuth(async (req: Request, context: Context, user: any) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const campaignId = pathParts[pathParts.indexOf('campaigns') + 1];
    const format = url.searchParams.get('format') || 'excel';

    if (!campaignId) {
      return new Response(JSON.stringify({ message: "Campaign ID is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = user.claims.sub;
    const campaign = await storage.getCampaign(campaignId);
    
    if (!campaign || campaign.userId !== userId) {
      return new Response(JSON.stringify({ message: "Campaign not found" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (campaign.status !== 'completed' || !campaign.resultData) {
      return new Response(JSON.stringify({ message: "Campaign not completed or no data available" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const filename = `${campaign.hashtag}_${campaign.id}_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    
    let fileBuffer: Buffer;
    let contentType: string;
    
    if (format === 'csv') {
      fileBuffer = await exportService.exportToCSVBuffer(campaign.resultData as any);
      contentType = 'text/csv';
    } else {
      fileBuffer = await exportService.exportToExcelBuffer(campaign.resultData as any);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error("Error downloading campaign results:", error);
    return new Response(JSON.stringify({ message: "Failed to download results" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

export const config: Config = {
  path: "/api/campaigns/*/download"
};
