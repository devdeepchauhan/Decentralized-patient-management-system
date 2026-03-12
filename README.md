# Decentralized Patient Management System (DPMS)

A fully working decentralized web application with frontend, backend, and blockchain integration for secure, immutable medical records.

![DPMS Logo Theme](client/public/logo.svg)

## Project Overview

The DPMS uses a hybrid Web2/Web3 architecture to solve healthcare data interoperability, security, and privacy issues.
1. **Frontend (React/Vite)**: Clean, user-friendly portal for Doctors, Patients, and Staff.
2. **Backend (Node.js/Express + MongoDB)**: Handles off-chain relational data such as identities, role-based login (JWT), and appointment schedules.
3. **Smart Contracts (Solidity/Hardhat)**: Ensures that critical medical reports, once uploaded, are cryptographically verifiable and immutable.
4. **IPFS (Simulated/Pinata)**: Distributed storage layer preventing central points of failure for the large clinical documents.

## How Blockchain Ensures Data Integrity

In traditional systems, a doctor or malicious actor could retroactively edit a medical database without leaving a trace. DPMS utilizes Ethereum Smart Contracts where each added `Record` forms a permanent, tamper-proof transaction. 
When a report is created, the system pins the raw medical data to **IPFS**, generating a unique CID (Content Identifier) string. This CID is appended strictly via the `addRecord` smart contract function alongside a cryptographic `RecordHash`, timestamp, and the Doctor's wallet address. Once confirmed in a block, these attributes cannot be overwritten due to the immutable nature of the blockchain ledger. Altering even a single comma in the IPFS document would yield a completely different hash, immediately alerting users of tampering.

## How Hash Codes Allow Secure Retrieval

A patient registers via the Web2 portal, generating a unique `Hash ID` (derived via SHA-256 of their email+salt). Traditional PII (Personal Identifiable Information) is kept strictly off-chain on the secure MongoDB layer. 
The Web3 Smart Contract only knows "Wallet A appended IPFS Hash to Wallet B". When a Doctor needs to append a new report, they exclusively search the patient by their `Hash ID`. This retrieves the patient's public Ethereum Wallet address, allowing the Doctor to submit the transaction to the proper wallet mapping without ever recording the patient's name or SSN directly on the transparent blockchain. The patient then uses their wallet signature to authenticate reads from the contract, maintaining privacy.

## How Doctors Interact with Smart Contracts

1. The Doctor connects their MetaMask or local node wallet.
2. They input the Patient's Hash ID to retrieve their target Wallet Address.
3. They fill out the diagnosis/prescription.
4. The frontend asynchronously uploads this text to IPFS.
5. `ethers.js` prompts the Doctor to sign a transaction invoking `addRecord()` on the deployed `MedicalRecords` contract.
6. The Doctor pays gas, and the transaction is finalized onto the Ethereum testnet.

## Quick Start & Local Development Setup

### 1. Blockchain (Hardhat)
```bash
cd contracts
npm install
# Start local node
npx hardhat node
# Keep that terminal open, open a new one:
npx hardhat run scripts/deploy.js --network localhost
```
*(The deployed address is automatically saved to `contracts/contract-address.json` for the frontend)*

### 2. Backend Server
```bash
cd server
npm install
npm run dev
```
*(Runs on `http://localhost:5000`)*

### 3. Frontend Application
```bash
cd client
npm install
npm run dev
```
*(Runs on Vite's default port, e.g., `http://localhost:5173`)*

## Docker Strategy (Future Scaling)

To containerize the application for production, you would:
1. Wrap the **Node.js Server** and **React App (Nginx Build)** in separate `Dockerfile`s.
2. Create a `docker-compose.yml` that links an isolated `mongo:latest` instance to the Node Backend.
3. Provision the Smart Contract strictly to an Ethereum Testnet (Sepolia/Goerli) via Infura or Alchemy RPC URLs configured in environment variables, removing the need to dockerize a full blockchain node.
