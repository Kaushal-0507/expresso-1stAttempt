import mongoose from 'mongoose';
import { User } from '../models/userModel.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
const envPath = join(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

dotenv.config({ path: envPath });

if (!process.env.MONGO_URI) {
  console.error('MONGO_URI not found in environment variables');
  process.exit(1);
}

const makeAdmin = async (email) => {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Using MongoDB URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });
    if (!user) {
      console.error('User not found with email:', email);
      process.exit(1);
    }

    console.log('Found user:', user.email);
    user.role = 'admin';
    await user.save();

    console.log(`Successfully made ${user.email} an admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

makeAdmin(email); 