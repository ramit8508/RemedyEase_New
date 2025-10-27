import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const AUTHORIZED_ADMIN_EMAIL = "ramitgoyal1987@gmail.com";

const AdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "admin"
  },
  refreshToken: {
    type: String
  }
}, { timestamps: true });

const Admin = mongoose.model("Admin", AdminSchema);

const createAdminAccount = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error("MongoDB URI not found in environment variables");
    }
    
    await mongoose.connect(`${mongoUri}/RemedyEaseDB`);
    console.log("✅ Connected to MongoDB (RemedyEaseDB)");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: AUTHORIZED_ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log("⚠️  Admin account already exists!");
      console.log("Email:", existingAdmin.email);
      console.log("\n🔄 Deleting old admin and creating new one...");
      await Admin.deleteOne({ email: AUTHORIZED_ADMIN_EMAIL });
    }

    // Prompt for password (or set default)
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123"; // Change this!
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin account
    const admin = await Admin.create({
      email: AUTHORIZED_ADMIN_EMAIL,
      password: hashedPassword,
      fullname: "Ramit Goyal",
      role: "admin"
    });

    console.log("\n🎉 Admin account created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:", admin.email);
    console.log("🔑 Password:", adminPassword);
    console.log("👤 Full Name:", admin.fullname);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  IMPORTANT: Please change the password after first login!");
    console.log("⚠️  Store these credentials securely!");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin account:", error.message);
    process.exit(1);
  }
};

createAdminAccount();
