describe('firebase service initialization', () => {
  const mockInitialize = jest.fn();
  const mockCredential = { cert: jest.fn(() => ({})) };

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('firebase-admin', () => ({
      __esModule: true,
      default: {
        apps: [],
        credential: mockCredential,
        initializeApp: mockInitialize,
      },
    }));
    process.env.FIREBASE_PROJECT_ID = 'pid';
    process.env.FIREBASE_CLIENT_EMAIL = 'client@email';
    process.env.FIREBASE_PRIVATE_KEY = 'key';
  });

  it('initializes app when credentials present', async () => {
    await import('./firebase');
    expect(mockInitialize).toHaveBeenCalled();
    expect(mockCredential.cert).toHaveBeenCalled();
  });

  it('does not reinitialize when app already exists', async () => {
    mockInitialize.mockClear();
    jest.resetModules();
    jest.doMock('firebase-admin', () => ({
      __esModule: true,
      default: {
        apps: [{}],
        credential: mockCredential,
        initializeApp: mockInitialize,
      },
    }));
    await import('./firebase');
    expect(mockInitialize).not.toHaveBeenCalled();
  });
});

