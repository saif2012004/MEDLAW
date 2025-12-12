import request from 'supertest';
import axios from 'axios';
import app from '../app';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('/api/rag routes', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: { status: 'healthy' } } as any);
  });

  it('returns health information from rag services', async () => {
    const res = await request(app).get('/api/rag/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('rag_api');
    expect(res.body).toHaveProperty('vector_api');
  });
});

