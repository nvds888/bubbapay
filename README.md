# BubbaPay

> ** In BETA** 

Send Algorand Standard Assets (ASAs) instantly via shareable URLs. Fast, secure, and user-friendly payments that make crypto transfers as easy as sharing a link.

## What is BubbaPay?

BubbaPay simplifies crypto payments on Algorand by allowing users to send ASAs through shareable links. Recipients don't need to know complex wallet addresses or have deep crypto knowledge - they just click a link to claim their funds. If the sender chooses to cover recipient fees, the recipient can claim without having a balance to opt-in.

## Key Features

- 🔒 **Secure Escrow System** - Unique one-time-use App hold funds safely until recipients claim them
- 📧 **Link Sharing** - Send payments via shareable links - share directly via WhatsApp or Telegram
- 🛡️ **Temporary Account Security** - Unique authorization credentials for each transfer
- 🔐 **Hash-Based Protection** - Database breaches cannot expose claim credentials
- 💸 **Fee Coverage** - Optional transaction fee coverage for seamless recipient experience
- 🔄 **Fund Recovery** - Senders can always reclaim unclaimed transfers after timeout
- ⚡ **Instant Claims** - Recipients claim funds immediately after wallet connect

## Architecture

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS 
- **Wallet Integration**: Use-Wallet & Use-Wallet-UI by TxnLab

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB for metadata and transfer tracking

### Blockchain
- **Platform**: Algorand blockchain
- **SDK**: Algosdk 3.4.0 JavaScript
- **Smart Contracts**: Custom TEAL programs for escrow functionality


## Usage

1. **Create Transfer**: Connect your Algorand wallet and specify the ASA and amount
2. **Generate Link**: System creates a secure, shareable URL
3. **Share**: Send the link via email, messaging, or social media
4. **Claim**: Recipient clicks link and claims funds to their wallet
5. **Complete**: Funds are transferred instantly from escrow
6. **Clean**: Clean up the App to free up reserve balance and get back some algo

## Development Status

### Completed
- Escrow smart contract functionality
- Frontend wallet integration
- Link generation and sharing system
- Database schema and API endpoints
- Simple Referral Program
- Fee coverage included directly in escrow App
- Recovery system to delete App when claimURL is lost 
- Better organisation of backend routes and utilities
- Proper instructions for edge case scenarios (warnings and instructions)

###  In Progress
- 

### Upcoming
- More ASAs

## Known Issues

- MCP scripts are outdated 
- Email send code is outdated 
- Some redundant endpoints and helper functions
- Loss of claim url when page unmounts during signing process - edge case on mobile

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



## 🙏 Acknowledgments

- [TxnLab](https://txnlab.dev/) for Use-Wallet integration tools
- Algorand Foundation for blockchain infrastructure
- The open-source community for various dependencies

