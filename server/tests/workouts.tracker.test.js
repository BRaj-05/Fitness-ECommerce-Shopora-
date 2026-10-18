const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../middleware/verifyFirebaseToken', () => (req, _res, next) => {
  req.user = { uid: 'tracker-test-user' };
  next();
});

const workoutsRouter = require('../routes/workouts');
const WorkoutLog = require('../models/WorkoutLog');

const app = express();
app.use(express.json());
app.use('/api/workouts', workoutsRouter);

let mongoServer;

beforeAll(async () => {
  const binary = 'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe';
  if (process.platform === 'win32' && fs.existsSync(binary)) {
    process.env.MONGOMS_SYSTEM_BINARY = binary;
  }
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await WorkoutLog.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('check-out preserves the existing plan, check-in, checklist, and daily work', async () => {
  const checkInAt = '2026-10-11T04:30:00.000Z';
  const checkOutAt = '2026-10-11T05:45:00.000Z';
  const plan = {
    name: 'Hypertrophy Foundation',
    focus: 'Muscle Building',
    duration: '12 Weeks',
    durationWeeks: 12,
    difficulty: 'Beginner',
    startDate: '2026-10-11',
    startedAt: '2026-10-11T04:25:00.000Z',
  };

  const createResponse = await request(app).post('/api/workouts').send({
    date: '2026-10-11',
    title: 'Hypertrophy Foundation - Day 1',
    notes: 'Strong first session',
    checklist: [{ id: 'warmup', text: 'Complete warm-up', completed: true }],
    exercises: [{ id: 'push-up', name: 'Push-up', gifUrl: null }],
    checkInAt,
    plan,
  });
  expect(createResponse.status).toBe(200);

  const checkoutResponse = await request(app).post('/api/workouts').send({
    date: '2026-10-11',
    checkOutAt,
  });
  expect(checkoutResponse.status).toBe(200);

  const getResponse = await request(app).get('/api/workouts');
  expect(getResponse.status).toBe(200);
  expect(getResponse.body['2026-10-11']).toEqual(expect.objectContaining({
    title: 'Hypertrophy Foundation - Day 1',
    notes: 'Strong first session',
    checkInAt,
    checkOutAt,
    plan: expect.objectContaining(plan),
    checklist: [{ id: 'warmup', text: 'Complete warm-up', completed: true }],
    exercises: [expect.objectContaining({ id: 'push-up', name: 'Push-up' })],
  }));
});

test('rejects a workout update with no fields besides the date', async () => {
  const response = await request(app).post('/api/workouts').send({ date: '2026-10-11' });
  expect(response.status).toBe(400);
});
