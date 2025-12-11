import axios from 'axios';

type Provider = 'openai' | 'anthropic' | 'stub';

interface GenerateParams {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}

interface ClassificationResult {
  flow: string;
  intendedPage: string;
  entities: Record<string, any>;
  confidence: number;
}

class LlmService {
  private provider: Provider;

  constructor() {
    const envProvider = (process.env.LLM_PROVIDER || 'stub').toLowerCase();
    if (envProvider === 'openai' || envProvider === 'anthropic') {
      this.provider = envProvider;
    } else {
      this.provider = 'stub';
    }
  }

  async generate({ prompt, temperature = 0.1, max_tokens = 500 }: GenerateParams) {
    if (this.provider === 'openai') {
      const { OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.chat.completions.create({
        model: process.env.LLM_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens,
        temperature,
      });
      return response.choices[0]?.message?.content || '';
    }

    if (this.provider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      const resp = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: process.env.LLM_MODEL || 'claude-3-haiku-20240307',
          max_tokens,
          temperature,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      return resp.data?.content?.[0]?.text || '';
    }

    return (
      'Stubbed LLM response. Provide concise regulatory guidance. ' +
      'Set LLM_PROVIDER=openai or anthropic with API keys for real outputs.'
    );
  }

  async classify(query: string): Promise<ClassificationResult> {
    // First, try keyword-based classification for speed
    const keywordResult = this.classifyByKeywords(query);
    if (keywordResult.confidence >= 0.8) {
      return keywordResult;
    }

    // If stub mode or low confidence, use enhanced keyword matching
    if (this.provider === 'stub') {
      return keywordResult;
    }

    // Use LLM for better classification
    try {
      const classificationPrompt = `Analyze this user query and classify their intent.

Query: "${query}"

Classify the intent as ONE of the following:
1. "templates" - User wants to find/view regulatory templates (DHF, SOP, CAPA, RMF, etc.)
2. "alerts" - User wants to see regulatory alerts, updates, recalls, or compliance news
3. "chat" - User has a general regulatory question that needs an AI answer

Also extract any entities:
- templateType: specific template mentioned (e.g., "DHF", "SOP", "CAPA")
- dateRange: date/time mentioned (e.g., "last week", "June 2024")
- regulation: regulation mentioned (e.g., "FDA", "EU MDR", "ISO 13485")
- deviceType: medical device type mentioned

Respond in valid JSON format only:
{
  "intent": "templates" | "alerts" | "chat",
  "confidence": 0.0-1.0,
  "entities": {
    "templateType": "string or null",
    "dateRange": "string or null",
    "regulation": "string or null",
    "deviceType": "string or null"
  }
}`;

      const response = await this.generate({
        prompt: classificationPrompt,
        temperature: 0.1,
        max_tokens: 200,
      });

      // Parse the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const intentToPage: Record<string, string> = {
          templates: 'templates',
          alerts: 'alerts',
          chat: 'chat',
        };

        const intentToFlow: Record<string, string> = {
          templates: 'C',
          alerts: 'C',
          chat: 'A',
        };

        return {
          flow: intentToFlow[parsed.intent] || 'A',
          intendedPage: intentToPage[parsed.intent] || 'chat',
          entities: parsed.entities || {},
          confidence: parsed.confidence || 0.7,
        };
      }
    } catch (error) {
      console.error('LLM classification failed, falling back to keywords:', error);
    }

    // Fallback to keyword classification
    return keywordResult;
  }

  private classifyByKeywords(query: string): ClassificationResult {
    const lower = query.toLowerCase();
    
    // Template patterns
    const templatePatterns = [
      { pattern: /\bdhf\b|design history file/i, type: 'DHF' },
      { pattern: /\bsop\b|standard operating procedure/i, type: 'SOP' },
      { pattern: /\bcapa\b|corrective.*preventive/i, type: 'CAPA' },
      { pattern: /\brmf\b|risk management file/i, type: 'RMF' },
      { pattern: /\bdmr\b|device master record/i, type: 'DMR' },
      { pattern: /\bqms\b|quality management system/i, type: 'QMS' },
      { pattern: /\biec\s*62304/i, type: 'IEC 62304' },
      { pattern: /template|form|checklist|document\s+template/i, type: null },
    ];

    for (const { pattern, type } of templatePatterns) {
      if (pattern.test(lower)) {
        return {
          flow: 'C',
          intendedPage: 'templates',
          entities: { templateType: type || query },
          confidence: type ? 0.9 : 0.75,
        };
      }
    }

    // Alert patterns
    const alertPatterns = [
      /\balert/i,
      /\bupdate/i,
      /\brecall/i,
      /\bwarning/i,
      /\bnotification/i,
      /\bnews\b/i,
      /\bchanges?\s+to\b/i,
      /last\s+(week|month|day)/i,
      /recent\s+(changes?|updates?)/i,
    ];

    for (const pattern of alertPatterns) {
      if (pattern.test(lower)) {
        // Extract date range if present
        const dateMatch = lower.match(/(last\s+\w+|yesterday|today|this\s+\w+|\d{4}|january|february|march|april|may|june|july|august|september|october|november|december)/i);
        
        return {
          flow: 'C',
          intendedPage: 'alerts',
          entities: { 
            dateRange: dateMatch ? dateMatch[0] : null,
            query: query,
          },
          confidence: 0.8,
        };
      }
    }

    // Default to chat
    return {
      flow: 'A',
      intendedPage: 'chat',
      entities: {},
      confidence: 0.6,
    };
  }

  async extractEntities(query: string) {
    const lower = query.toLowerCase();
    
    // Extract regulations
    const regulations: string[] = [];
    const regulationPatterns = [
      { pattern: /fda|21\s*cfr/i, name: 'FDA' },
      { pattern: /eu\s*mdr|mdr\s*2017/i, name: 'EU MDR' },
      { pattern: /iso\s*13485/i, name: 'ISO 13485' },
      { pattern: /iso\s*14971/i, name: 'ISO 14971' },
      { pattern: /iec\s*62304/i, name: 'IEC 62304' },
      { pattern: /hipaa/i, name: 'HIPAA' },
      { pattern: /gdpr/i, name: 'GDPR' },
    ];
    
    for (const { pattern, name } of regulationPatterns) {
      if (pattern.test(lower)) {
        regulations.push(name);
      }
    }

    // Extract device types
    const deviceTypes: string[] = [];
    const devicePatterns = [
      /\b(pacemaker|defibrillator|icd)\b/i,
      /\b(ventilator|respirator)\b/i,
      /\b(insulin pump|infusion pump)\b/i,
      /\b(x-ray|ct scan|mri|imaging)\b/i,
      /\b(catheter|stent)\b/i,
      /\b(implant|prosthetic)\b/i,
    ];
    
    for (const pattern of devicePatterns) {
      const match = lower.match(pattern);
      if (match) {
        deviceTypes.push(match[0]);
      }
    }

    // Extract date range
    let dateRange = null;
    const datePatterns = [
      /last\s+(week|month|year|day|\d+\s+days?)/i,
      /this\s+(week|month|year)/i,
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{4}/i,
      /\d{4}/,
    ];
    
    for (const pattern of datePatterns) {
      const match = lower.match(pattern);
      if (match) {
        dateRange = match[0];
        break;
      }
    }

    return {
      regulations,
      deviceTypes,
      dateRange,
      raw: query,
    };
  }
}

export const llmService = new LlmService();
