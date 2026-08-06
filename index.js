'use strict';
var CryptoJS = require("crypto-js");
var Express = require("express");
var bodyParser = require('body-parser');
var WebSocket = require("ws");

var http_port = process.env.HTTP_PORT || 3001;
var p2p_port = process.env.P2P_PORT || 6001;
var initialPeers = process.env.PEERS ? process.env.PEERS.split(',') : [];

// PROOF OF WORK CONFIGURATION: Difficulty = number of leading zeros required in SHA-256 hash
const DIFFICULTY = 4;

class Block {
    constructor(index, previousHash, timestamp, data, hash, nonce, difficulty) {
        this.index = index;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash.toString();
        this.nonce = nonce;
        this.difficulty = difficulty;
    }
}

var sockets = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

var getGenesisBlock = () => {
    return new Block(0, "0", 1465154705, "Genesis Block - Node.js Blockchain Core", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7", 0, DIFFICULTY);
};

var blockchain = [getGenesisBlock()];

var initHttpServer = () => {
    var app = Express();
    app.use(bodyParser.json());

    // Get current blockchain state
    app.get('/blocks', (req, res) => res.send(JSON.stringify(blockchain)));
    
    // Mine a new block via HTTP POST request
    app.post('/mineBlock', (req, res) => {
        var newBlock = mineBlock(req.body.data);
        addBlock(newBlock);
        broadcast(responseLatestMsg());
        console.log('Block mined and added to local chain: ' + JSON.stringify(newBlock));
        res.send(newBlock);
    });
    
    // List connected P2P peers
    app.get('/peers', (req, res) => {
        res.send(sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
    });
    
    // Connect to a new peer node manually
    app.post('/addPeer', (req, res) => {
        connectToPeers([req.body.peer]);
        res.send();
    });
    
    app.listen(http_port, () => console.log('Listening HTTP on port: ' + http_port));
};

var initP2PServer = () => {
    var server = new WebSocket.Server({port: p2p_port});
    server.on('connection', ws => initConnection(ws));
    console.log('Listening P2P port on: ' + p2p_port);
};

var initConnection = (ws) => {
    sockets.push(ws);
    initMessageHandler(ws);
    initErrorHandler(ws);
    write(ws, queryChainLengthMsg());
};

var initMessageHandler = (ws) => {
    ws.on('message', (data) => {
        var message = JSON.parse(data);
        console.log('Received P2P message: ' + JSON.stringify(message));
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                write(ws, responseLatestMsg());
                break;
            case MessageType.QUERY_ALL:
                write(ws, responseChainMsg());
                break;
            case MessageType.RESPONSE_BLOCKCHAIN:
                handleBlockchainResponse(message);
                break;
        }
    });
};

var initErrorHandler = (ws) => {
    var closeConnection = (ws) => {
        console.log('Connection failed to peer: ' + ws.url);
        sockets.splice(sockets.indexOf(ws), 1);
    };
    ws.on('close', () => closeConnection(ws));
    ws.on('error', () => closeConnection(ws));
};

// ====================================================================
// PROOF OF WORK MINING ALGORITHM
// ====================================================================
var mineBlock = (blockData) => {
    var previousBlock = getLatestBlock();
    var nextIndex = previousBlock.index + 1;
    var nextTimestamp = Math.floor(new Date().getTime() / 1000);
    var nonce = 0;
    var nextHash = '';

    console.log(`[PoW] Mining block #${nextIndex} with Difficulty target${DIFFICULTY}...`);
    
    // Loop increments nonce until the computed hash starts with '0000'
    while (true) {
        nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData, nonce, DIFFICULTY);
        if (nextHash.substring(0, DIFFICULTY) === "0".repeat(DIFFICULTY)) {
            console.log(`[PoW Success] Valid Block found! Nonce: ${nonce} \vert{} Hash:${nextHash}`);
            break;
        }
        nonce++;
    }

    return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash, nonce, DIFFICULTY);
};

var calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data, block.nonce, block.difficulty);
};

var calculateHash = (index, previousHash, timestamp, data, nonce, difficulty) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data + nonce + difficulty).toString();
};

var addBlock = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
};

var isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('Invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('Invalid previousHash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log('Invalid hash calculation');
        return false;
    }
    return true;
};

var connectToPeers = (newPeers) => {
    newPeers.forEach((peer) => {
        var ws = new WebSocket(peer);
        ws.on('open', () => initConnection(ws));
        ws.on('error', () => {
            console.log('Connection failed to peer');
        });
    });
};

var handleBlockchainResponse = (message) => {
    var receivedBlocks = JSON.parse(message.data).sort((b1, b2) => (b1.index - b2.index));
    var latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    var latestBlockHeld = getLatestBlock();
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log('Blockchain behind locally. Local: ' + latestBlockHeld.index + ' Peer: ' + latestBlockReceived.index);
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log("Appending received block to local chain");
            blockchain.push(latestBlockReceived);
            broadcast(responseLatestMsg());
        } else if (receivedBlocks.length === 1) {
            console.log("Querying full chain from peer");
            broadcast(queryAllMsg());
        } else {
            console.log("Replacing local chain with longer valid peer chain");
            replaceChain(receivedBlocks);
        }
    } else {
        console.log('Received blockchain is not longer than current chain. Ignoring.');
    }
};

var replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) && newBlocks.length > blockchain.length) {
        console.log('Received chain is valid. Replacing current blockchain state.');
        blockchain = newBlocks;
        broadcast(responseLatestMsg());
    } else {
        console.log('Received chain is invalid.');
    }
};

var isValidChain = (blockchainToValidate) => {
    if (JSON.stringify(blockchainToValidate[0]) !== JSON.stringify(getGenesisBlock())) {
        return false;
    }
    var tempBlocks = [blockchainToValidate[0]];
    for (var i = 1; i < blockchainToValidate.length; i++) {
        if (isValidNewBlock(blockchainToValidate[i], tempBlocks[i - 1])) {
            tempBlocks.push(blockchainToValidate[i]);
        } else {
            return false;
        }
    }
    return true;
};

var getLatestBlock = () => blockchain[blockchain.length - 1];
var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});
var responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain)
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

connectToPeers(initialPeers);
initHttpServer();
initP2PServer();