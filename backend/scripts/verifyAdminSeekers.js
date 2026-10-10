// Integration checks use new, disposable local databases only.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const host = process.env.ADMIN_VERIFY_DB_HOST || '127.0.0.1';
const user = process.env.ADMIN_VERIFY_DB_USER || 'root';
const password = process.env.ADMIN_VERIFY_DB_PASSWORD || '';
const suffix = randomUUID().replaceAll('-', '').slice(0, 10);
const databases = ['expert', 'seeker', 'admin'].map(module => `jatayu_verify_${module}_${suffix}`);
const adminPassword = randomUUID();
const secret = randomUUID();
Object.assign(process.env, { DB_HOST: host, DB_USER: user, DB_PASSWORD: password, JWT_SECRET: secret,
  EXPERT_DB_NAME: databases[0], SEEKER_DB_NAME: databases[1], ADMIN_DB_NAME: databases[2] });
for (const prefix of ['EXPERT', 'SEEKER', 'ADMIN']) {
  process.env[`${prefix}_DB_USER`] = user; process.env[`${prefix}_DB_PASSWORD`] = password;
}
let connection, server, models;
try {
  connection = await mysql.createConnection({ host, user, password });
  for (const database of databases) await connection.query(`CREATE DATABASE \`${database}\``);
  models = await import('../models/index.js');
  const { syncAllDatabases } = await import('../config/db/index.js');
  await syncAllDatabases();
  const { Seeker, Booking, Notification, SeekerCreditTransaction, Admin } = models;
  const admin = await Admin.create({ email: 'admin@example.com', fullName: 'Verification Admin', password: await bcrypt.hash(adminPassword, 4), role: 'admin' });
  await Seeker.bulkCreate(Array.from({ length: 100 }, (_, i) => ({ email: `seeker-${i}@example.com`, fullName: `Verification ${i}`, status: 'active' })));
  const seeker = await Seeker.create({ email: 'target@example.com', fullName: 'Admin Verification Seeker', status: 'active', credits: 101 });
  const other = await Seeker.create({ email: 'other@example.com', fullName: 'Other Seeker', status: 'deleted' });
  const expertId = randomUUID();
  await Booking.bulkCreate(Array.from({ length: 101 }, (_, i) => ({ seekerId: seeker.id, expertId, idempotencyKey: String(i), status: 'completed', paymentStatus: 'paid', consultationType: 'video', subject: 'Verification session', context: '', scheduledStartAt: new Date('2026-10-01T10:00:00Z'), scheduledEndAt: new Date('2026-10-01T10:30:00Z'), timezone: 'Asia/Kolkata', expertName: 'Verification Expert', consultationFee: 100, gst: 49, totalAmount: 149, payableAmount: 149 })));
  await SeekerCreditTransaction.bulkCreate(Array.from({ length: 101 }, (_, i) => ({ seekerId: seeker.id, amount: 1, balanceAfter: i + 1, type: 'credit', source: 'onboarding', reference: String(i) })));
  const notification = await Notification.create({ recipientType: 'seeker', recipientId: seeker.id, eventType: 'booking.created', title: 'Verification notification', body: 'Persisted test notification', href: '' });
  const app = express(); app.use(cors({ origin: 'http://127.0.0.1:3100' })); app.use(express.json());
  const { default: adminRoutes } = await import('../routes/adminRoutes.js');
  app.use('/api/admin', adminRoutes);
  app.get('/api/notifications', (req, res) => res.json({ items: [], unreadCount: 0 }));
  server = app.listen(process.argv.includes('--serve') ? 5055 : 0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, secret);
  const call = async (path, method = 'GET', body, bearer = token) => {
    const res = await fetch(base + '/api/admin/seekers' + path, { method, headers: { Authorization: bearer ? `Bearer ${bearer}` : '', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, data: await res.json() };
  };
  assert.equal((await call('', 'GET', null, '')).status, 401);
  assert.equal((await call('', 'GET', null, jwt.sign({ id: seeker.id, role: 'seeker' }, secret))).status, 403);
  const first = await call('?limit=100'); assert.equal(first.data.items.length, 100); assert.equal(first.data.pagination.total, 102);
  const second = await call('?limit=100&page=2'); assert.equal(second.data.items.length, 2);
  const searched = await call('?search=target@example.com'); assert.equal(searched.data.items[0].id, seeker.id);
  const detail = await call(`/${seeker.id}`); assert.equal(detail.data.seeker.totalBookings, 101); assert.equal(detail.data.seeker.totalSpent, 150.49); assert.equal(detail.data.credits.earned, 101);
  assert.equal((await call(`/${seeker.id}/status`, 'PATCH', { status: 'suspended' })).status, 200);
  assert.equal((await Seeker.findByPk(seeker.id)).status, 'suspended');
  await call(`/${seeker.id}/status`, 'PATCH', { status: 'active' });
  const grants = await Promise.all([call(`/${seeker.id}/credits`, 'POST', { amount: 1 }), call(`/${seeker.id}/credits`, 'POST', { amount: 2 })]);
  assert.ok(grants.every(result => result.status === 201));
  assert.equal((await Seeker.findByPk(seeker.id)).credits, 104);
  const entries = await SeekerCreditTransaction.findAll({ where: { seekerId: seeker.id, source: 'admin_adjustment' } });
  assert.equal(entries.length, 2); assert.ok(entries.every(entry => {
    const metadata = typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata;
    return metadata.adminId === admin.id;
  }));
  const create = SeekerCreditTransaction.create;
  try {
    SeekerCreditTransaction.create = async () => { throw Error('Intentional rollback check'); };
    assert.equal((await call(`/${seeker.id}/credits`, 'POST', { amount: 10 })).status, 500);
  } finally { SeekerCreditTransaction.create = create; }
  assert.equal((await Seeker.findByPk(seeker.id)).credits, 104);
  assert.equal((await call(`/${other.id}/credits`, 'POST', { amount: 10 })).status, 409);
  assert.equal((await call(`/${other.id}/notifications/${notification.id}/read`, 'PATCH')).status, 404);
  assert.equal((await call(`/${seeker.id}/notifications/${notification.id}/read`, 'PATCH')).status, 200);
  assert.equal((await Notification.findByPk(notification.id)).readAt instanceof Date, true);
  console.log('PASS: authorization, SQL pagination/search, complete totals, status persistence, concurrent credits, admin audit, transaction rollback, deleted accounts, notification ownership.');
  if (process.argv.includes('--serve')) {
    await fs.writeFile('/tmp/jatayu-admin-verify.json', JSON.stringify({ email: admin.email, password: adminPassword, seekerId: seeker.id, otherId: other.id, base }), { mode: 0o600 });
    console.log('Verification API ready at port 5055; temporary fixture metadata saved privately.');
    await new Promise(resolve => { process.once('SIGTERM', resolve); process.once('SIGINT', resolve); });
  }
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  if (models) await Promise.all([models.expertDb.close(), models.seekerDb.close(), models.adminDb.close()]);
  if (connection) {
    for (const database of databases) await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await connection.end();
  }
  await fs.rm('/tmp/jatayu-admin-verify.json', { force: true });
}
