import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Enhanced database connection with proper error handling
const connectdb = async () => {
  try {
    // Connection options for better stability and performance
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000 // Socket timeout
    };

    const connectionCheck = await mongoose.connect(
      `${process.env.MONGO_URL}/${DB_NAME}`,
      connectionOptions
    );
    
    console.log(`✅ Doctor DB Connected: ${connectionCheck.connection.host}`);
    console.log(`📋 Database Name: ${connectionCheck.connection.name}`);
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ Database connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Database disconnected - attempting reconnection...');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Database reconnected successfully');
    });
    
  } catch (error) {
    console.error("💥 Database connection failed:", error.message);
    console.error("🔧 Please check your MongoDB connection string");
    process.exit(1);
  }
};

export default connectdb;
