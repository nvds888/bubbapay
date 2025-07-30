// mcp-server.js - Simple MCP server for your existing project
// Just drop this file in your project root and run: node mcp-server.js

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

const API_URL = process.env.API_URL || 'http://localhost:5000/api/mcp';

// Create server
const server = new Server(
  {
    name: 'nomizopay',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_payment_link',
      description: 'Create a secure payment link for USDC or xUSD on Algorand',
      inputSchema: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Amount to send (e.g., 25.50)',
            minimum: 0.01,
          },
          asset: {
            type: 'string',
            description: 'Asset to send',
            enum: ['USDC', 'xUSD'],
            default: 'USDC',
          },
          sender_address: {
            type: 'string',
            description: 'Your Algorand wallet address',
          },
          recipient_email: {
            type: 'string',
            description: 'Optional: Recipient email. Leave empty for shareable link.',
          },
          cover_fees: {
            type: 'boolean',
            description: 'Cover recipient transaction fees?',
            default: true,
          },
        },
        required: ['amount', 'sender_address'],
      },
    },
    {
      name: 'check_payment_status',
      description: 'Check status of a payment by ID',
      inputSchema: {
        type: 'object',
        properties: {
          payment_id: {
            type: 'string',
            description: 'Payment ID to check',
          },
        },
        required: ['payment_id'],
      },
    },
    {
      name: 'list_my_payments',
      description: 'List all payments for a wallet address',
      inputSchema: {
        type: 'object',
        properties: {
          wallet_address: {
            type: 'string',
            description: 'Algorand wallet address',
          },
        },
        required: ['wallet_address'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_payment_link': {
        // Convert asset symbol to asset ID
        const assetId = args.asset === 'xUSD' ? 760037151 : 31566704; // Default to USDC
        
        const response = await fetch(`${API_URL}/create-escrow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: args.sender_address,
            amount: parseFloat(args.amount), // Ensure it's a number
            recipientEmail: args.recipient_email || null,
            coverRecipientFees: args.cover_fees !== false,
            shareable: !args.recipient_email,
            assetId: assetId, // Include the asset ID
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment link');
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ Payment link created!

Amount: ${args.amount} ${args.asset || 'USDC'}
Recipient: ${args.recipient_email || 'Shareable link'}
Fees covered: ${args.cover_fees !== false ? 'Yes' : 'No'}

🔗 Click here to sign the transaction:
${data.signingUrl}

Payment ID: ${data.escrowId}

${data.userMessage}`,
            },
          ],
        };
      }

      case 'check_payment_status': {
        const response = await fetch(`${API_URL}/escrow/${args.payment_id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error('Payment not found');
        }

        // Map asset ID to symbol
        const assetSymbol = data.escrow.assetId === 760037151 ? 'xUSD' : 'USDC';

        return {
          content: [
            {
              type: 'text',
              text: `Payment Status: ${data.escrow.status}

Amount: ${data.escrow.amount} ${assetSymbol}
Created: ${new Date(data.escrow.createdAt).toLocaleDateString()}
Recipient: ${data.escrow.recipientEmail || 'Shareable link'}
App ID: ${data.escrow.appId || 'Not yet deployed'}

${data.escrow.claimed ? '✅ Funds have been claimed!' : '⏳ Waiting for claim'}`,
            },
          ],
        };
      }

      case 'list_my_payments': {
        const response = await fetch(`${API_URL}/user-escrows/${args.wallet_address}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error('Failed to fetch payments');
        }

        const summary = `Your Payments Summary:
Active: ${data.summary.active}
Claimed: ${data.summary.claimed} 
Pending: ${data.summary.pending}
Total: ${data.total}

Recent payments:
${data.escrows.slice(0, 5).map(escrow => {
  const assetSymbol = escrow.assetId === 760037151 ? 'xUSD' : 'USDC';
  return `• ${escrow.amount} ${assetSymbol} to ${escrow.recipientEmail || 'shareable link'} - ${escrow.status}`;
}).join('\n')}`;

        return {
          content: [
            {
              type: 'text',
              text: summary,
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool failed: ${error.message}`
    );
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NomizoPay MCP server running...');
}

main().catch(console.error);