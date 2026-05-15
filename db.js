const { MongoClient } = require("mongodb");

// MongoDB 连接地址（从你本地 Compass 复制）
const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "wenjuan";

let db = null;

async function connectDB() {
  if (db) return db;
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("✅ MongoDB 连接成功，数据库：", DB_NAME);
  return db;
}

function getDB() {
  if (!db) throw new Error("数据库未连接");
  return db;
}

module.exports = { connectDB, getDB };
