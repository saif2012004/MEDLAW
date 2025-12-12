import mongoose from 'mongoose';
import { connectMongo } from './mongodb';

jest.mock('mongoose');
const mockedMongoose = mongoose as unknown as { connect: jest.Mock };

describe('connectMongo', () => {
  beforeEach(() => {
    mockedMongoose.connect = jest.fn().mockResolvedValue(undefined);
    process.env.MONGODB_URI = '';
  });

  it('skips connection when URI missing', async () => {
    await connectMongo();
    expect(mockedMongoose.connect).not.toHaveBeenCalled();
  });

  it('connects only once when URI provided', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    await connectMongo();
    await connectMongo(); // second call should be no-op
    expect(mockedMongoose.connect).toHaveBeenCalledTimes(1);
  });
});

