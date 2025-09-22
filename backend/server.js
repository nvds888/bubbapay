const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const sgMail = require('@sendgrid/mail');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const claimsRoutes = require('./routes/claims');
const cleanupRoutes = require('./routes/cleanup');
const assetsRoutes = require('./routes/assets');
const mcpRoutes = require('./routes/mcpapi');
const referralRoutes = require('./routes/referrals');
const escrowRoutes = require('./routes/escrows');

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

// Trust proxy for rate limiting 
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', false);
}

// Set up SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// MongoDB connection
const connectToDatabase = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority'
    });
    
    await client.connect();
    console.log('Connected to MongoDB Atlas successfully');
    const db = client.db('algosend');
    
    await db.admin().ping();
    console.log('MongoDB ping successful');
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// ===============================
// RATE LIMITING CONFIGURATION
// ===============================

const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/health' || req.path === '/api/mcp/health';
  }
});

const transactionRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
  message: {
    error: 'Transaction rate limit exceeded. Please wait before creating another transfer.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':transactions';
  }
});

const claimRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  message: {
    error: 'Too many claim attempts. Please wait before trying again.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':claims';
  }
});

const optInRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    error: 'Opt-in rate limit exceeded. Please wait before trying again.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':optin';
  }
});

// Basic middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://localhost:3000',
    'https://nompay.vercel.app',
    'https://bubbapay.app',
    'https://www.bubbapay.app' 
  ],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Apply general rate limiting to all API routes
app.use('/api', generalRateLimit);

// Health check routes (not rate limited)
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AlgoSend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    if (req.app.locals.db) {
      await req.app.locals.db.admin().ping();
      health.database = 'connected';
    } else {
      health.database = 'not_initialized';
      health.status = 'degraded';
    }
  } catch (error) {
    health.database = 'error';
    health.status = 'unhealthy';
    health.databaseError = error.message;
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get('/api/mcp/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'AlgoSend MCP API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start the server
const startServer = async () => {
  try {
    // Connect to database
    console.log('Attempting to connect to MongoDB...');
    const db = await connectToDatabase();
    
    // Make db available to routes
    app.locals.db = db;
    
    // ✅ Apply specific rate limits BEFORE registering routes
    // Transaction endpoints
    app.use('/api/generate-transactions', transactionRateLimit);
    app.use('/api/submit-app-creation', transactionRateLimit);
    app.use('/api/submit-group-transactions', transactionRateLimit);
    app.use('/api/generate-reclaim', transactionRateLimit);
    app.use('/api/submit-reclaim', transactionRateLimit);
    app.use('/api/cleanup-contract', transactionRateLimit);
    app.use('/api/submit-cleanup', transactionRateLimit);
    app.use('/api/escrows', escrowRoutes);
    
    // Claim endpoints
    app.use('/api/generate-optimized-claim', claimRateLimit);
    app.use('/api/submit-optimized-claim', claimRateLimit);
    app.use('/api/generate-claim', claimRateLimit);
    app.use('/api/claim-usdc', claimRateLimit);
    app.use('/api/fund-wallet', claimRateLimit);
    
    // Opt-in endpoints
    app.use('/api/generate-optin', optInRateLimit);
    app.use('/api/submit-optin', optInRateLimit);
    app.use('/api/generate-optin-and-claim', optInRateLimit);
    
    // ✅ Register API routes AFTER rate limits and database connection
    app.use('/api', apiRoutes);
    app.use('/api', claimsRoutes);
    app.use('/api', cleanupRoutes);
    app.use('/api', assetsRoutes);
    app.use('/api/mcp', mcpRoutes);

    app.use('/api/referrals', referralRoutes);
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 AlgoSend server running on port ${PORT}`);
      console.log(`📍 Main API: http://localhost:${PORT}/api`);
      console.log(`🤖 MCP API: http://localhost:${PORT}/api/mcp`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`🛡️  Rate limiting enabled - layered protection`);
      console.log(`🗄️  Database: Connected to MongoDB Atlas`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();