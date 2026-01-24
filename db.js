import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://127.0.0.1:27017");

export default async function connectDB() {
  await client.connect();
  console.log("MongoDB connection successful");
  return client.db("BusBookingDB");
}
