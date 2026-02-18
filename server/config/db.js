const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      console.error('❌ MongoDB connection error: MONGO_URI is not set in .env file');
      console.error('Please add MONGO_URI to your .env file');
      console.error('Example: MONGO_URI=mongodb://localhost:27017/examportal');
      console.error('Or for MongoDB Atlas: MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Provide helpful error messages based on error type
    if (error.message.includes('IP') && error.message.includes('whitelist')) {
      console.error('\n🔒 IP Whitelist Issue Detected!');
      console.error('\n📋 Step-by-step fix:');
      console.error('   1. Go to MongoDB Atlas: https://cloud.mongodb.com');
      console.error('   2. Select your project → Click "Network Access" (or "IP Access List")');
      console.error('   3. Click "Add IP Address" or "Add Entry"');
      console.error('   4. Click "Add Current IP Address" (recommended)');
      console.error('      OR add "0.0.0.0/0" to allow all IPs (less secure, for development only)');
      console.error('   5. Click "Confirm"');
      console.error('   6. Wait 1-2 minutes for changes to propagate');
      console.error('   7. Restart your server');
      console.error('\n💡 Tip: For development, you can use 0.0.0.0/0, but remove it in production!');
    } else if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 This usually means:');
      console.error('   - Your MongoDB Atlas cluster is paused, deleted, or unreachable');
      console.error('   - The cluster DNS records cannot be resolved');
      console.error('   - Network connectivity issues');
      console.error('\n🔧 Quick fixes:');
      console.error('   1. Check MongoDB Atlas dashboard: https://cloud.mongodb.com');
      console.error('   2. Verify your cluster is running (not paused)');
      console.error('   3. Get a fresh connection string from Atlas');
      console.error('   4. Or switch to local MongoDB: MONGO_URI=mongodb://localhost:27017/examportal');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 This usually means:');
      console.error('   - The MongoDB hostname cannot be resolved (DNS error)');
      console.error('   - Your MongoDB Atlas cluster may have been deleted or changed');
      console.error('   - Check your MONGO_URI in the .env file');
      console.error('   - Verify your internet connection');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n💡 This usually means:');
      console.error('   - Incorrect username or password in MONGO_URI');
      console.error('   - Check your MongoDB Atlas credentials');
    } else if (error.message.includes('timeout')) {
      console.error('\n💡 This usually means:');
      console.error('   - MongoDB server is not reachable');
      console.error('   - Check your network connection');
      console.error('   - Verify MongoDB Atlas IP whitelist settings');
    }
    
    console.error('\n📝 To fix this:');
    console.error('   1. Check your .env file in the server directory');
    console.error('   2. Verify MONGO_URI is correct');
    console.error('   3. For MongoDB Atlas: Ensure your IP is whitelisted');
    console.error('   4. For local MongoDB: Ensure MongoDB is running');
    
    process.exit(1);
  }
};

module.exports = connectDB;

