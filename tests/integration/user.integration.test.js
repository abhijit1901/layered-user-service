const request = require('supertest');
const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const knex = require('knex');
const { createApp } = require('../../src/app');
const UserRepository = require('../../src/repositories/user.repository');
const UserService = require('../../src/services/user.service');
const { createPool } = require('../../src/config/db');

let container;
let pool;
let dbClient;
let app;

// Allow up to 60 seconds for the Docker container to start
jest.setTimeout(60000);

beforeAll(async () => {
  // 1. Start a fresh Postgres container for this test file
  // We explicitly specify the image to avoid the "undefined split" error
    container = await new PostgreSqlContainer('postgres:15').start();
  
  const connectionString = container.getConnectionUri();

  // 2. Run your REAL migrations on this test container
  dbClient = knex({
    client: 'pg',
    connection: connectionString,
    migrations: { directory: './migrations' }
  });
  
  await dbClient.migrate.latest();

  // 3. Connect your App to this container
  pool = createPool(connectionString);
  const repo = new UserRepository(pool);
  const service = new UserService(repo);
  app = createApp({ userService: service });
});

afterAll(async () => {
  // Only try to stop things if they actually exist
  if (pool) await pool.end();
  if (dbClient) await dbClient.destroy();
  if (container) await container.stop();
});

beforeEach(async () => {
  // Clear the table before every test so tests don't affect each other
  await dbClient('users').truncate();
});

describe('User Integration API', () => {
  it('POST /api/users - creates a user successfully', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'integration@test.com', name: 'Integration User' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('integration@test.com');
  });

  it('GET /api/users/:id - retrieves the created user', async () => {
    // First create a user
    const createRes = await request(app)
      .post('/api/users')
      .send({ email: 'retrieve@test.com', name: 'Retriever' });
    
    const userId = createRes.body.id;

    // Then try to get it
    const getRes = await request(app).get(`/api/users/${userId}`);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.name).toBe('Retriever');
  });
});