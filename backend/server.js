const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const sgMail = require('@sendgrid/mail');
const apiRoutes = require('./routes/api');
const fs = require('fs');
const path = require('path');

// Ensure utils directory exists
const utilsDir = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir);
}

const hashUtilsPath = path.join(utilsDir, 'hashUtils.js');
if (!fs.existsSync(hashUtilsPath)) {
  const hashUtilsContent = `const crypto = require('crypto');

// Hash function that can be used consistently across the application
function hashClaimCode(claimCode) {
  return crypto.createHash('sha256').update(claimCode).digest('hex');
}

module.exports = { hashClaimCode };`;

  fs.writeFileSync(hashUtilsPath, hashUtilsContent);
  console.log('Created hashUtils.js file');
}

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// MongoDB connection
const connectToDatabase = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db('algosend');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start the server
const startServer = async () => {
  // Connect to database
  const db = await connectToDatabase();
  
  // Make db available to routes
  app.locals.db = db;
  
  // Register API routes
  app.use('/api', apiRoutes);
  
  // Start listening
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();