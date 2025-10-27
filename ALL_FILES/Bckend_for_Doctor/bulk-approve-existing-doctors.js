import mongoose from 'mongoose';
import 'dotenv/config';
import { Doctor } from './src/models/Doctor.models.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Bulk approve all existing doctors
const bulkApproveExistingDoctors = async () => {
  try {
    console.log('\n🔍 Finding all doctors with pending approval status...\n');

    // Find all doctors with pending status
    const pendingDoctors = await Doctor.find({ approvalStatus: 'pending' });
    
    console.log(`📊 Found ${pendingDoctors.length} doctors with pending approval\n`);

    if (pendingDoctors.length === 0) {
      console.log('✅ No pending doctors found. All doctors are already approved!');
      return;
    }

    // Display the doctors
    console.log('📋 Doctors to be approved:');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    pendingDoctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ${doctor.fullname}`);
      console.log(`   📧 Email: ${doctor.email}`);
      console.log(`   🏥 Specialization: ${doctor.specialization}`);
      console.log(`   📅 Registered: ${doctor.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Bulk update all pending doctors to approved
    const result = await Doctor.updateMany(
      { approvalStatus: 'pending' },
      { 
        $set: { 
          approvalStatus: 'approved',
          approvedAt: new Date()
        } 
      }
    );

    console.log(`✅ Successfully approved ${result.modifiedCount} existing doctors!`);
    console.log('\n📌 Note: These doctors were already registered before the admin approval');
    console.log('   system was implemented. They can now login immediately.');
    console.log('\n📧 No emails were sent to these doctors as they are already active users.\n');
    
  } catch (error) {
    console.error('❌ Error during bulk approval:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the script
(async () => {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     BULK APPROVE EXISTING DOCTORS - RemedyEase Admin Tool    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  await connectDB();
  await bulkApproveExistingDoctors();
  
  console.log('✨ Process completed!\n');
  process.exit(0);
})();
