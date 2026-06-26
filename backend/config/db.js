const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI environment variable is not set!");
  }

  // Log the host only (never log passwords)
  try {
    const parsed = new URL(uri);
    console.log(`[DB] Connecting to host: ${parsed.hostname} ...`);
  } catch {
    console.log("[DB] Connecting to database (URI hostname could not be parsed for logging) ...");
  }

  await mongoose.connect(uri, {
    dbName: "d3_detox",
    serverSelectionTimeoutMS: 15000, // 15s — enough for Atlas cold start
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
  });

  console.log(`[DB] Connected successfully: ${mongoose.connection.host}`);
};

module.exports = connectDB;
