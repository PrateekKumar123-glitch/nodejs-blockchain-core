
# Node.js Blockchain Core

A blockchain demo and visualization project built with a Node.js blockchain core and a React frontend. The project demonstrates proof-of-work mining, peer-to-peer synchronization, blockchain state exploration, and a guided walkthrough for understanding how blocks and transactions fit together.

---

## Overview

This repository combines:

- a JavaScript blockchain implementation in `index.js`
- a browser-based blockchain UI in `src/`
- a Socket.IO server for the demo app in `src/server.js`
- Docker packaging for the client and server services

The result is a small educational blockchain environment that can be run locally or in containers.

---

## Features

- Proof-of-work mining with SHA-256 and configurable difficulty
- P2P blockchain synchronization over WebSockets
- Longest-chain validation and rollback/replace logic
- Block and transaction visualization in the React app
- Identities, wallets, and UTXO-style demonstration data
- Guided walkthrough UI for learning blockchain mechanics
- Docker Compose support for running the frontend and backend together

---

## Requirements

- Node.js 18+
- npm
- Docker and Docker Compose (optional, for containerized setup)

---

## Install

```bash
git clone https://github.com/PrateekKumar123-glitch/nodejs-blockchain-core.git
cd nodejs-blockchain-core
npm install
```

---

## Run the project

### 1) Start the blockchain core

This starts the blockchain node on HTTP port `3001` and P2P port `6001`.

```bash
npm start
```

### 2) Start a second peer

Open another terminal and run:

```bash
npm run peer
```

This starts a second node on HTTP `3002` and P2P `6002`, and connects it to the first node.

### 3) Start the React client

Open a third terminal and run:

```bash
npm run client
```

Then open:

```text
http://localhost:3000
```

The frontend depends on the browser demo state and can be used alongside the blockchain backend.

---

## API endpoints

The blockchain core exposes a small HTTP API:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/blocks` | Returns the current blockchain state |
| `POST` | `/mineBlock` | Mines a new block from posted data |
| `GET` | `/peers` | Lists connected peer addresses |
| `POST` | `/addPeer` | Connects to a remote peer |

### Example: mine a block

```bash
curl -X POST http://localhost:3001/mineBlock \
  -H "Content-Type: application/json" \
  -d '{"data": "Transaction Payload #1"}'
```

### Example: fetch the blockchain

```bash
curl http://localhost:3001/blocks
```

---

## Architecture

The application is split into three layers:

1. Blockchain core (`index.js`)
   - Maintains the chain state
   - Implements proof-of-work mining
   - Handles peer connections and block validation
   - Exposes the HTTP API on ports `3001`/`3002`

2. Demo server (`src/server.js`)
   - Runs a Socket.IO server on port `4000`
   - Supports the interactive browser-based blockchain demo
   - Broadcasts live events between clients and the simulation layer

3. Frontend (`src/`)
   - React app rendered through `src/App.js`
   - Displays blockchain state, identities, transactions, and walkthrough UI
   - Lets users explore blocks, UTXOs, and chain behavior visually

In practice, the blockchain logic and the interactive demo are related but separate parts of the project. The Node backend is the chain engine, while the frontend and Socket.IO server provide the learning experience and visualization layer.

---

## Docker

The project includes a container setup for the client and backend.

```bash
docker-compose up --build
```

This runs:

- client on port `3000`
- socket server on port `4000`

The Docker configuration is defined in:

- `docker-compose.yml`
- `Dockerfile.client`
- `Dockerfile.server`

---

## Repository structure

```text
.
├── index.js                 # Core blockchain logic and PoW implementation
├── src/                    # React frontend and blockchain demo components
├── src/server.js            # Socket.IO server used by the UI demo
├── package.json            # Scripts and dependencies
├── docker-compose.yml      # Multi-container setup
├── Dockerfile.client       # Frontend container build
├── Dockerfile.server       # Backend container build
├── nginx.conf              # Nginx setup for the client container
├── public/                 # Static assets for CRA
├── build/                  # Production frontend build output
├── README.md               # Project documentation
└── helm-chart/             # Kubernetes chart templates
```

---

## Notes

- `index.js` is the blockchain backend used for mining and peer synchronization.
- `src/server.js` is a separate local Socket.IO server for the interactive browser demo.
- This project is primarily educational and demonstrative, intended to show how blockchain concepts can be implemented in a browser and Node.js environment.

---

## License

MIT
