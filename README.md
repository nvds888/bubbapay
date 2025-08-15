# 💰 BubbaPay

> **⚠️ Currently in Development** - This project is actively being developed and is not yet ready for production use.

Send Algorand Standard Assets (ASAs) instantly via shareable URLs. Fast, secure, and user-friendly payments that make crypto transfers as easy as sharing a link.

## 🌟 What is BubbaPay?

BubbaPay simplifies cryptocurrency payments by allowing users to send ASAs through shareable links. Recipients don't need to know complex wallet addresses or have deep crypto knowledge - they just click a link to claim their funds.

## ✨ Key Features

- 🔒 **Secure Escrow System** - App hold funds safely until recipients claim them
- 📧 **Email & Link Sharing** - Send payments via shareable links or email
- 🛡️ **Temporary Account Security** - Unique authorization credentials for each transfer
- 🔐 **Hash-Based Protection** - Database breaches cannot expose claim credentials
- 💸 **Fee Coverage** - Optional transaction fee coverage for seamless recipient experience
- 🔄 **Fund Recovery** - Senders can always reclaim unclaimed transfers after timeout
- ⚡ **Instant Claims** - Recipients claim funds immediately upon verification

## 🏗️ Architecture

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS 
- **Wallet Integration**: Use-Wallet & Use-Wallet-UI by TxnLab

### Backend
- **Runtime**: Node.js with Express.js framework
- **Database**: MongoDB for metadata and transfer tracking
- **API**: RESTful endpoints

### Blockchain
- **Platform**: Algorand blockchain
- **SDK**: Algosdk 3.4.0 JavaScript
- **Smart Contracts**: Custom TEAL programs for escrow functionality
- specific blockchain scripts: atomic-deploy-email-escrow.js, claimandclean.js, teal-programs.js 


## 📖 Usage

1. **Create Transfer**: Connect your Algorand wallet and specify the ASA and amount
2. **Generate Link**: System creates a secure, shareable URL
3. **Share**: Send the link via email, messaging, or social media
4. **Claim**: Recipient clicks link and claims funds to their wallet
5. **Complete**: Funds are transferred instantly from escrow

## 🛠️ Development Status

### ✅ Completed
- escrow smart contract functionality
- Frontend wallet integration
- Link generation and sharing system
- Database schema and API endpoints

### 🚧 In Progress
- protection against loss of statemanagement (edge cases on mobile) - without sacrificying security
- possible fee coverage included in App, to enable reclaim

### 📋 Upcoming
- more ASAs
- Batch payment functionality
- Analytics dashboard

## 🐛 Known Issues

- MCP scripts require updating to latest version
- Some edge cases in error handling need refinement

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



## 🙏 Acknowledgments

- [TxnLab](https://txnlab.dev/) for Use-Wallet integration tools
- Algorand Foundation for blockchain infrastructure
- The open-source community for various dependencies

