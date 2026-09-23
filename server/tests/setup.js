import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("digiwarranty");
  process.env.JWT_SECRET = "test_access_secret_1234567890";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret_1234567890";
  process.env.NODE_ENV = "test";
  await mongoose.connect(process.env.MONGODB_URI, { retryWrites: false });
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
