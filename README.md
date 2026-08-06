# Node.js Blockchain Core

A lightweight, decentralized, peer-to-peer blockchain protocol built from scratch in Node.js. Features SHA-256 Proof-of-Work (PoW) consensus, dynamic peer synchronization over WebSockets, and a simple HTTP API for mining and inspecting blocks.

---

## Features

* **Proof-of-Work (PoW):** Custom consensus mechanism requiring blocks to meet a target hash difficulty (`0000` prefix) using nonces and SHA-256 hashing.
* **P2P Networking:** Direct WebSockets communication between nodes for block propagation and chain synchronization.
* **Conflict Resolution:** Automatic "longest valid chain" rule to settle forks across connected peers.
* **HTTP REST API:** Endpoints to submit new data, mine blocks, view current chain state, and manage connected peers.
* **Cross-Platform:** Works out-of-the-box on Windows PowerShell/CMD, macOS, and Linux using `cross-env`.

---

## Quick Start

### Prerequisites

* [Node.js](https://nodejs.org/) (v16 or higher)
* npm (comes bundled with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/nodejs-blockchain-core.git
cd nodejs-blockchain-core

```


2. Install dependencies:
```bash
npm install

```



---

## Running the Blockchain

### 1. Start Primary Node (Node 1)

Runs HTTP server on port `3001` and P2P WebSocket server on port `6001`:

```bash
npm start

```

### 2. Start Secondary Peer Node (Node 2)

Open a second terminal window and launch a peer on ports `3002` (HTTP) and `6002` (P2P), configured to auto-connect to Node 1:

```bash
npm run peer

```

---

## API Endpoints & Usage

You can interact with your nodes using `curl`, PowerShell, or Postman.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/blocks` | Fetch the full local blockchain ledger |
| `POST` | `/mineBlock` | Mine a new block with provided payload data |
| `GET` | `/peers` | List connected WebSocket peer addresses |
| `POST` | `/addPeer` | Manually connect to another P2P node |

### Examples (Windows PowerShell)

**Mine a new block:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/mineBlock" -Method POST -ContentType "application/json" -Body '{"data": "Transaction Payload #1"}'

```

**Get current chain:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/blocks" -Method GET

```

### Examples (Linux / macOS cURL)

**Mine a new block:**

```bash
curl -X POST http://localhost:3001/mineBlock \
  -H "Content-Type: application/json" \
  -d '{"data": "Transaction Payload #1"}'

```

---

## Project Structure

```text
├── index.js             # Core blockchain logic, PoW mining, P2P & HTTP servers
├── package.json         # Dependencies and cross-platform start scripts
├── docker-compose.yml   # Multi-node container setup
└── README.md            # Documentation

```

---

## How Proof-of-Work Operates

When `/mineBlock` receives data:

1. It grabs the previous block's hash and index.
2. It initializes a `nonce` counter at `0`.
3. It repeatedly calculates a SHA-256 hash across `(index + previousHash + timestamp + data + nonce + difficulty)`.
4. Increments `nonce` until the resulting hash satisfies the condition: starting with `DIFFICULTY` number of zeroes (default: `4`).
5. Once a valid hash is found, the block is appended locally and broadcasted to all WebSocket peers.

---

## License

MIT
