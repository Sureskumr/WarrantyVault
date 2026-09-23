import request from 'supertest';
import { app } from '../src/app.js';

async function setupStoreWithOwner() {
  const payload = {
    name: 'Owner',
    email: `owner${Date.now()}${Math.random()}@example.com`,
    phone: '9876543210',
    password: 'Passw0rd123',
    storeName: 'Electronics Hub',
  };
  const res = await request(app).post('/api/v1/auth/register').send(payload);
  return { token: res.body.data.accessToken, user: res.body.data.user };
}

async function createProduct(token, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Samsung Washing Machine',
      sku: `SKU-${Date.now()}-${Math.random()}`,
      price: 20000,
      taxRate: 18,
      stockQuantity: 10,
      warrantyTemplate: { duration: 12, durationUnit: 'MONTHS', startType: 'PURCHASE_DATE' },
      ...overrides,
    });
  return res.body.data.product;
}

async function createCustomer(token, overrides = {}) {
  const res = await request(app)
    .post('/api/v1/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Jane Doe', phone: `9${Date.now().toString().slice(-9)}`, ...overrides });
  return res.body.data.customer;
}

describe('Billing → Warranty → Verification', () => {
  it('creates an invoice, auto-registers a warranty, and both are publicly verifiable via QR token', async () => {
    const { token } = await setupStoreWithOwner();
    const product = await createProduct(token);
    const customer = await createCustomer(token);

    const invoiceRes = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id,
        items: [{ productId: product._id, quantity: 1 }],
        paymentMethod: 'CASH',
        amountPaid: 23600,
      });

    expect(invoiceRes.status).toBe(201);
    const invoice = invoiceRes.body.data.invoice;
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{2}-/);
    expect(invoice.items[0].warrantyId).toBeDefined();
    expect(invoice.qrCodeDataUrl).toMatch(/^data:image\/png/);

    // Stock should have decremented.
    const productAfter = await request(app).get(`/api/v1/products/${product._id}`).set('Authorization', `Bearer ${token}`);
    expect(productAfter.body.data.product.stockQuantity).toBe(9);

    // Public QR verification — no auth required.
    const verifyRes = await request(app).get(`/api/v1/verification/invoice/${invoice.verificationToken}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.verified).toBe(true);
    expect(verifyRes.body.data.customer.name).toBe('Verified Customer'); // masked
    expect(verifyRes.body.data.items[0].warranty.status).toBe('ACTIVE');

    // OTP-gated full verification by invoice number.
    const otpRes = await request(app).post('/api/v1/verification/send-otp').send({ invoiceNumber: invoice.invoiceNumber });
    expect(otpRes.status).toBe(200);
    const devOtp = otpRes.body.data.devOtp;
    expect(devOtp).toMatch(/^\d{6}$/);

    const verifyOtpRes = await request(app).post('/api/v1/verification/verify-otp').send({ invoiceNumber: invoice.invoiceNumber, code: devOtp });
    expect(verifyOtpRes.status).toBe(200);
    expect(verifyOtpRes.body.data.customer.phone).toBe(customer.phone); // full detail unlocked post-OTP
  });

  it('rejects billing when stock is insufficient', async () => {
    const { token } = await setupStoreWithOwner();
    const product = await createProduct(token, { stockQuantity: 1 });
    const customer = await createCustomer(token);

    const res = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id, items: [{ productId: product._id, quantity: 5 }], paymentMethod: 'CASH', amountPaid: 100000 });

    expect(res.status).toBe(400);
  });
});

describe('Service request → technician workflow', () => {
  it('takes a service request from creation through verification, assignment, and completion', async () => {
    const { token } = await setupStoreWithOwner();
    const product = await createProduct(token);
    const customer = await createCustomer(token);

    await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id, items: [{ productId: product._id, quantity: 1 }], paymentMethod: 'CASH', amountPaid: 23600 });

    // Create technician
    const techRes = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tech One', email: `tech${Date.now()}@example.com`, phone: '9876500001', password: 'Passw0rd123', role: 'TECHNICIAN' });
    const technicianId = techRes.body.data.user._id;
    const techLogin = await request(app).post('/api/v1/auth/login').send({ email: techRes.body.data.user.email, password: 'Passw0rd123' });
    const techToken = techLogin.body.data.accessToken;

    // Raise service request (staff on behalf of customer)
    const srRes = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: customer._id, productId: product._id, problemDescription: 'Machine not starting', contactPhone: customer.phone });
    expect(srRes.status).toBe(201);
    const requestId = srRes.body.data.request._id;
    expect(srRes.body.data.request.status).toBe('VERIFICATION_PENDING');

    // Verify (warranty is active from the invoice above)
    const verifyRes = await request(app)
      .patch(`/api/v1/services/${requestId}/verify`)
      .set('Authorization', `Bearer ${token}`)
      .send({ approve: true });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.request.status).toBe('VERIFIED');

    // Assign technician
    const assignRes = await request(app)
      .patch(`/api/v1/services/${requestId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ technicianId });
    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.request.status).toBe('ASSIGNED');

    // Technician walks the request through to completion
    const steps = [
      { nextStatus: 'TECHNICIAN_VISIT' },
      { nextStatus: 'DIAGNOSIS', diagnosis: 'Faulty motor' },
      { nextStatus: 'REPAIR_IN_PROGRESS' },
      { nextStatus: 'COMPLETED', repairNotes: 'Motor replaced' },
    ];
    let lastRes;
    for (const step of steps) {
      lastRes = await request(app).patch(`/api/v1/services/${requestId}/status`).set('Authorization', `Bearer ${techToken}`).send(step);
      expect(lastRes.status).toBe(200);
    }
    expect(lastRes.body.data.request.status).toBe('COMPLETED');

    // A technician cannot act on a request that isn't theirs / wrong transition
    const invalidTransition = await request(app)
      .patch(`/api/v1/services/${requestId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ nextStatus: 'DIAGNOSIS' });
    expect(invalidTransition.status).toBe(400); // COMPLETED has no further allowed transitions
  });
});
