// Load environment variables first thing
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";

// Start the server after database connection
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    const PORT = process.env.PORT || 8000;
    
    app.listen(PORT, () => {
      console.log(`🚀 User Backend Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: Connected to RemedyEaseDB`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
