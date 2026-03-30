import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo: MongoMemoryServer;
beforeAll(async function () {
    mongo = await MongoMemoryServer.create();
    console.log(mongo.getUri());
    await mongoose.connect(mongo.getUri());
});

beforeEach(async function () {
    const collections = await mongoose.connection.db?.collections();
    collections?.forEach((collection) => collection.deleteMany({}));
});

afterAll(async function () {
    await mongoose.connection.close();
    await mongo.stop();
});
