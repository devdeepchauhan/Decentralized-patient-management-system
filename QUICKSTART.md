# Quick Start Commands

The files are located in: `C:\Users\Asus\.gemini\antigravity\playground\pulsing-kilonova`

Here is how you start all the environments (I am doing this for you right now in the background):

### 1. Start the Local Blockchain (Hardhat)
Open a terminal in the `contracts` folder and run:
`npx hardhat node`
*(This starts the local Ethereum network).*

Then open another terminal in the `contracts` folder and deploy the smart contract:
`npx hardhat run scripts/deploy.js --network localhost`

### 2. Start the Backend API (Node.js & MongoDB)
Open a terminal in the `server` folder and run:
`npm run dev`
*(Runs on http://localhost:5000)*

### 3. Start the Frontend App (React/Vite)
Open a terminal in the `client` folder and run:
`npm run dev`
*(Runs on http://localhost:5173)*

Once they are running, open your browser to **http://localhost:5173**.
