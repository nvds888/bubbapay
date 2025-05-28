const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const sgMail = require('@sendgrid/mail');
const rateLimit = require('express-rate-limit'); // Add this import
const apiRoutes = require('./routes/api');
const mcpRoutes = require('./routes/mcpapi');
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

// MongoDB connection - FIXED OPTIONS
const connectToDatabase = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI, {
      // Connection pooling and timeout settings
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      // Additional options for stability
      retryWrites: true,
      w: 'majority'
    });
    
    await client.connect();
    console.log('Connected to MongoDB Atlas successfully');
    const db = client.db('algosend');
    
    // Test the connection
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

// General API rate limit (more permissive)
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/api/mcp/health';
  }
});

// Strict rate limit for transaction endpoints (more restrictive)
const transactionRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 transaction requests per 5 minutes
  message: {
    error: 'Transaction rate limit exceeded. Please wait before creating another transfer.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use a custom key generator to be more specific about what we're rate limiting
  keyGenerator: (req) => {
    return req.ip + ':transactions';
  }
});

// Claim rate limit (moderate)
const claimRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // limit each IP to 20 claim attempts per 10 minutes
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

// Very strict rate limit for opt-in operations
const optInRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 opt-in requests per hour
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

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Apply general rate limiting to all API routes
app.use('/api', generalRateLimit);

// Health check routes (keep existing, not rate limited)
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AlgoSend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  // Test database connection
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

// MCP-specific health check
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
    
    // Apply specific rate limits to sensitive endpoints BEFORE registering routes
    app.use('/api/generate-transactions', transactionRateLimit);
    app.use('/api/submit-app-creation', transactionRateLimit);
    app.use('/api/submit-group-transactions', transactionRateLimit);
    app.use('/api/generate-reclaim', transactionRateLimit);
    app.use('/api/submit-reclaim', transactionRateLimit);
    
    // Apply claim rate limits
    app.use('/api/generate-claim', claimRateLimit);
    app.use('/api/claim-usdc', claimRateLimit);
    app.use('/api/fund-wallet', claimRateLimit);
    
    // Apply opt-in rate limits
    app.use('/api/generate-optin', optInRateLimit);
    app.use('/api/submit-optin', optInRateLimit);
    
    // Register API routes
    app.use('/api', apiRoutes);           // Your existing routes
    app.use('/api/mcp', mcpRoutes);       // New MCP routes
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 AlgoSend server running on port ${PORT}`);
      console.log(`📍 Main API: http://localhost:${PORT}/api`);
      console.log(`🤖 MCP API: http://localhost:${PORT}/api/mcp`);
      console.log(`💚 Health: http://localhost:${PORT}/api/health`);
      console.log(`🛡️  Rate limiting enabled - in-memory storage`);
      console.log(`🗄️  Database: Connected to MongoDB Atlas`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();