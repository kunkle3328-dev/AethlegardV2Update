
import { aiClient } from "./aiClient";
import { VaultEntry } from "../schemas/vault.schema";
import { CognitiveProfile, ScanMode, SourceResult, ResearchResult, ResearchMode, FreshnessLevel } from "../types";
import { useAppStore } from "../stores/appStore";
import { promptBuilders } from "./promptBuilders";

const intelCache = new Map<string, ResearchResult>();

/**
 * Primary Search Providers (External to Gemini)
 * Order: Brave -> Tavily -> Local Fallback
 */
async function braveSearch(query: string): Promise<SourceResult[]> {
  const apiKey = (process.env as any).BRAVE_API_KEY;
  if (!apiKey) throw new Error("No Brave Key");
  
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey }
  });
  if (!response.ok) throw new Error(`Brave Error: ${response.status}`);
  const data = await response.json();
  return (data.web?.results || []).map((r: any) => ({
    title: r.title,
    uri: r.url,
    snippet: r.description,
    source: 'web' as const
  }));
}

async function tavilySearch(query: string): Promise<SourceResult[]> {
  const apiKey = (process.env as any).TAVILY_API_KEY;
  if (!apiKey) throw new Error("No Tavily Key");
  
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: "advanced" })
  });
  if (!response.ok) throw new Error(`Tavily Error: ${response.status}`);
  const data = await response.json();
  return (data.results || []).map((r: any) => ({
    title: r.title,
    uri: r.url,
    snippet: r.content,
    source: 'web' as const
  }));
}

async function fetchVerifiedSources(query: string, mode: ResearchMode, level: FreshnessLevel): Promise<SourceResult[]> {
  // PROVIDER ROTATION: Brave -> Tavily -> Wikipedia Fallback
  try {
    const results = await braveSearch(query);
    if (results.length > 0) return results;
  } catch (e) {
    console.warn("Brave search skipped...");
  }

  try {
    const results = await tavilySearch(query);
    if (results.length > 0) return results;
  } catch (e) {
    console.warn("Tavily search skipped...");
  }

  // Fallback to Wikipedia (No Key Required)
  try {
    const wikipediaUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(mode === 'news' ? query + " news" : query)}&format=json&origin=*`;
    const response = await fetch(wikipediaUrl);
    const data = await response.json();
    if (data.query?.search && data.query.search.length > 0) {
      return data.query.search.map((item: any) => ({
        title: item.title,
        uri: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        snippet: item.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
        published: item.timestamp,
        source: (mode === 'news' ? 'news' : 'web') as any
      }));
    }
  } catch (e) {
    console.warn(`Fallback search failure:`, e);
  }

  return [];
}

export const researchService = {
  async performScan(
    query: string, 
    vaultContext: VaultEntry[], 
    profile: CognitiveProfile | null, 
    scanMode: ScanMode = 'quick'
  ): Promise<ResearchResult> {
    const { researchMode, freshnessLevel, voiceProfile, matrixSettings } = useAppStore.getState();

    // 1. PRIMARY SEARCH: Independent of AI
    const rawSources = await fetchVerifiedSources(query, researchMode, freshnessLevel);
    const vaultHits: SourceResult[] = vaultContext
      .filter(v => v.summary.toLowerCase().includes(query.toLowerCase()) || v.content.toLowerCase().includes(query.toLowerCase()))
      .map(v => ({ 
        title: v.summary, 
        uri: '#', 
        snippet: v.content.slice(0, 200), 
        source: 'vault' as const,
        published: new Date(v.createdAt).toISOString()
      }));

    const allSources = [...vaultHits, ...rawSources];
    const baseResult: ResearchResult = {
      text: null,
      sources: allSources,
      mode: 'raw',
      status: allSources.length > 0 ? 'optimal' : 'offline',
      query
    };

    // 2. OPTIONAL AI ENRICHMENT (SILENT)
    const model = (matrixSettings.gpuAcceleration || scanMode === 'deep') ? 'gemini-3-pro-image-preview' : 'gemini-3-flash-preview';
    const prompt = `Synthesize an intelligence brief for: "${query}".\nContext: ${allSources.slice(0, 8).map(s => s.snippet).join('\n')}`;

    const response = await aiClient.generate({
      model,
      prompt,
      systemInstruction: `You are Aethelgard Synthesis. Tone: ${voiceProfile}.`
    });

    if (response && response.text) {
      return {
        ...baseResult,
        text: response.text,
        mode: 'live'
      };
    }

    return baseResult;
  },

  async inferRelationships(text: string, existingItems: VaultEntry[]) {
    const prompt = promptBuilders.inferLinks(text, existingItems.slice(0, 20));
    const response = await aiClient.generate({
      model: 'gemini-3-flash-preview',
      prompt,
      responseMimeType: "application/json"
    });

    if (!response || !response.text) return [];
    
    try {
      const parsed = JSON.parse(response.text);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
};
