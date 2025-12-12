import request from 'supertest';
import axios from 'axios';
import app from '../app';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('/api/query route', () => {
  beforeEach(() => {
    mockedAxios.post.mockResolvedValue({
      data: {
        result: {
          narrative: 'response narrative',
          checklist: ['item'],
          citations: {},
        },
      },
    } as any);
  });

  it('returns 400 when query is missing', async () => {
    const res = await request(app).post('/api/query').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/query is required/i);
  });

  it('processes text-only query and returns result', async () => {
    const res = await request(app)
      .post('/api/query')
      .send({ query: 'Test query', template_type: 'qa' });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.narrative).toBe('response narrative');
    expect(mockedAxios.post).toHaveBeenCalled();
  });
});

