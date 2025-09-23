// Quick test to verify MongoDB connection
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGO_URL:', process.env.MONGO_URL);
    
    const conn = await mongoose.connect(`${process.env.MONGO_URL}/testDB`);
    console.log('✅ MongoDB connected successfully!');
    console.log('Connection host:', conn.connection.host);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
  }
};

testConnection();