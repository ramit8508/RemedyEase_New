import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Database connection with retry logic
export const connectDB = async () => {
  try {
    // Mongoose connection options (removed deprecated options)
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`,
      options
    );
    
    console.log(`✅ MongoDB Connected: ${connectionInstance.connection.host}`);
    console.log(`📝 Database: ${connectionInstance.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error("💥 MongoDB connection failed:", error.message);
    console.error("🔧 Check your MONGO_URL in .env file");
    process.exit(1);
  }
};

export default connectDB;
