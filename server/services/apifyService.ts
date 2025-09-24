import { ApifyClient } from 'apify-client';

if (!process.env.APIFY_API_TOKEN) {
  throw new Error('APIFY_API_TOKEN is required');
}

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

export interface ApifyScrapingInput {
  hashtags: string[];
  resultsLimit: number;
}

export interface ApifyScrapingResult {
  id: string;
  url: string;
  type: string;
  caption: string;
  ownerId: string;
  ownerUsername: string;
  ownerFullName: string;
  hashtags: string[];
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  displayUrl: string;
  isSponsored: boolean;
  shortCode: string;
}

export class ApifyService {
  private readonly ACTOR_ID = 'apify/instagram-hashtag-scraper';

  private sanitizeHashtag(hashtag: string): string {
    // Remove # if present at the beginning
    let clean = hashtag.startsWith('#') ? hashtag.substring(1) : hashtag;
    
    // Keep only alphanumeric characters and underscores
    clean = clean.replace(/[^a-zA-Z0-9_]/g, '');
    
    // Ensure it's not empty after cleaning
    if (!clean) {
      throw new Error('Hashtag contains no valid characters');
    }
    
    return clean;
  }

  async startScrapingRun(input: ApifyScrapingInput): Promise<string> {
    try {
      // Clean hashtags before sending to Apify
      const cleanedInput = {
        ...input,
        hashtags: input.hashtags.map(hashtag => this.sanitizeHashtag(hashtag))
      };
      
      const run = await apifyClient.actor(this.ACTOR_ID).call(cleanedInput);
      return run.id;
    } catch (error) {
      console.error('Error starting Apify run:', error);
      throw new Error('Failed to start Instagram scraping');
    }
  }

  async getRun(runId: string) {
    try {
      return await apifyClient.run(runId).get();
    } catch (error) {
      console.error('Error getting Apify run:', error);
      throw new Error('Failed to get scraping run status');
    }
  }

  async getRunResults(runId: string): Promise<ApifyScrapingResult[]> {
    try {
      // First get the run details to get the dataset ID
      const run = await this.getRun(runId);
      
      // Check if run has completed and has a default dataset
      if (!run.defaultDatasetId) {
        throw new Error('Run has not completed or no data available');
      }
      
      // Get items from the run's dataset
      const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
      return items as ApifyScrapingResult[];
    } catch (error) {
      console.error('Error getting Apify run results:', error);
      throw new Error('Failed to get scraping results');
    }
  }

  async checkRunStatus(runId: string): Promise<'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'ABORTED'> {
    try {
      const run = await this.getRun(runId);
      return run.status;
    } catch (error) {
      console.error('Error checking run status:', error);
      return 'FAILED';
    }
  }
}

export const apifyService = new ApifyService();
