! This project is still in development

# AlgoSend

Send USDC instantly on Algorand. Fast, secure, and user-friendly payments for everyone.

## Features

- **Secure Escrow System**: Smart contracts hold funds until recipients claim them
- **Email & Link Sharing**: Send via email or shareable links
- **Temporary Account Security**: Unique authorization per transfer
- **Hash-Based Protection**: Database breaches cannot expose claim credentials
- **Fee Coverage**: Optional recipient fee coverage for seamless UX
- **Fund Recovery**: Creators can always reclaim unclaimed transfers

## Architecture

- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express
- **Blockchain**: Algorand with TEAL smart contracts
- **Database**: MongoDB for metadata storage

## Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm start
