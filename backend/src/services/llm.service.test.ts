import { llmService } from './llm.service';

describe('llmService', () => {
  it('returns stubbed generate response when provider is stub', async () => {
    const response = await llmService.generate({ prompt: 'hello' });
    expect(response).toMatch(/Stubbed LLM response/);
  });

  it('classifies template queries via keywords', async () => {
    const result = await llmService.classify('Need a DHF template for a device');
    expect(result.intendedPage).toBe('templates');
    expect(result.flow).toBe('C');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});

