Prime Chat: Decentralized Messaging Application
Prime Chat is a high-performance, secure messaging platform designed for the decentralized world. Built on the Extensible Message Transport Protocol (XMTP), it provides users with end-to-end encrypted 1:1 and group communication where their wallet serves as their identity.
🚀 Key Features
• Wallet-Native Identity: Seamlessly connect using your Ethereum wallet (EOA or SCW) via RainbowKit and Wagmi.
• Secured by XMTP (MLS): Every message is protected by the Messaging Layer Security (MLS) protocol, delivering forward secrecy and post-compromise security.
• Comprehensive User Consent: Maintain a spam-free inbox with three dedicated states: Inbox (Allowed), Requests (Unknown), and Blocked (Denied).
• Identity Resolution: Automatic detection and resolution of ENS names and Basenames to replace hex addresses with human-readable profiles [1695, Turn History Context].
• Familiar UX: A modern chat interface featuring real-time message streaming, unread badges, and dark/light mode support.
• Cross-App Continuity: Because your messages and consent preferences are stored on the XMTP network, your conversations follow you across any authorized app.
🛠 Tech Stack
• Framework: React (Vite)
• Messaging: XMTP Browser SDK v3
• Wallet Management: RainbowKit, Wagmi, Viem
• Styling: Tailwind CSS & Shadcn UI
• Animations: Framer Motion
• State Management: TanStack Query
🔧 Getting Started
1. Installation
Install the required XMTP and wallet dependencies:
npm install @xmtp/browser-sdk wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
2. Initialization
Prime Chat initializes an XMTP client using a Signer linked to the user's wallet. Ensure you set a unique appVersion for production telemetry.
const client = await Client.create(signer, {
  env: 'dev', // Use 'production' for mainnet
  appVersion: 'PrimeChat/1.x'
});
3. Synchronization
To ensure all historical messages and current conversation states are visible, Prime Chat uses the comprehensive syncAll method.
// Fetches all new welcomes, conversations, and messages simultaneously
await client.conversations.syncAll(['allowed']); 
 Deployment Considerations
When deploying Prime Chat in containerized environments (like Docker or GitHub Codespaces):
• IP Geoblocking: Nodes in dev and production enforce US-based geoblocking for restricted regions (e.g., Cuba, Iran, North Korea).
• Database Persistence: To avoid hitting the 10-installation limit per Inbox ID, always use persistent storage volumes for the SQLite .db3 files.
• History Sync: For a new deployment to pull old messages, a pre-existing installation of the same wallet must be online to provide the necessary encryption keys
