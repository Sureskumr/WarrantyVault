import request from 'supertest';
import { app } from '../src/app.js';

async function registerStore(overrides = {}) {
  const payload = {
    name: 'Store Owner',
    email: `owner${Date.now()}${Math.random()}@example.com`,
    phone: '9876543210',
    password: 'Passw0rd123',
    storeName: 'Test Electronics',
    ...overrides,
  };
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  return { res, payload };
}

describe('Auth', () => {
  it('registers a new owner + store and returns an access token', async () => {
    const { res } = await registerStore();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('OWNER');
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects duplicate email registration', async () => {
    const { payload } = await registerStore();
    const res2 = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res2.status).toBe(409);
    expect(res2.body.errorCode).toBe('DUPLICATE');
  });

  it('logs in with correct credentials and rejects wrong password', async () => {
    const { payload } = await registerStore();
    const ok = await request(app).post('/api/v1/auth/login').send({ email: payload.email, password: payload.password });
    expect(ok.status).toBe(200);

    const bad = await request(app).post('/api/v1/auth/login').send({ email: payload.email, password: 'WrongPass1' });
    expect(bad.status).toBe(401);
  });

  it('rejects requests with no token on protected routes', async () => {
    const res = await request(app).get('/api/v1/stores/me');
    expect(res.status).toBe(401);
  });
});

describe('RBAC + tenant isolation', () => {
  it('a CASHIER cannot create products (OWNER/MANAGER only)', async () => {
    const { payload: ownerPayload } = await registerStore();
    const login = await request(app).post('/api/v1/auth/login').send({ email: ownerPayload.email, password: ownerPayload.password });
    const ownerToken = login.body.data.accessToken;

    const cashierRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Cash Ier', email: `cashier${Date.now()}@example.com`, phone: '9876500000', password: 'Passw0rd123', role: 'CASHIER' });
    expect(cashierRes.status).toBe(201);

    const cashierLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: cashierRes.body.data.user.email, password: 'Passw0rd123' });
    const cashierToken = cashierLogin.body.data.accessToken;

    const productAttempt = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'Washing Machine', sku: 'WM-1', price: 20000 });
    expect(productAttempt.status).toBe(403);
  });

  it('a user from Store A cannot read Store B customer data', async () => {
    const { payload: ownerAPayload } = await registerStore();
    const loginA = await request(app).post('/api/v1/auth/login').send({ email: ownerAPayload.email, password: ownerAPayload.password });
    const tokenA = loginA.body.data.accessToken;

    const { payload: ownerBPayload } = await registerStore();
    const loginB = await request(app).post('/api/v1/auth/login').send({ email: ownerBPayload.email, password: ownerBPayload.password });
    const tokenB = loginB.body.data.accessToken;

    const customerB = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'B Customer', phone: '9000000001' });
    expect(customerB.status).toBe(201);

    // Store A's owner must get 404 (not found in their own tenant scope),
    // never Store B's data — this proves query-level tenant isolation.
    const crossRead = await request(app)
      .get(`/api/v1/customers/${customerB.body.data.customer._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect([403, 404]).toContain(crossRead.status);
  });
});
