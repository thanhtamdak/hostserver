// server.js - Mediasoup SFU + Express + Socket.IO + Redis
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mediasoup = require('mediasoup');
const Redis = require('ioredis');
const os = require('os');
const { createWorker } = require('./workers/createWorker');
const mediasoupConfig = require('./workers/mediasoupConfig');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Global variables
let workers = [];
let nextWorkerIndex = 0;
const rooms = new Map(); // roomId -> { router, participants, etc. }

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Serve Next.js build (for production)
app.use(express.static(path.join(__dirname, 'out'))); // Assuming exported Next.js build in /out

// Initialize workers
async function initWorkers() {
  const numWorkers = Math.max(os.cpus().length - 1, 1);
  for (let i = 0; i < numWorkers; i++) {
    const worker = await createWorker();
    workers.push(worker);
  }
  console.log(`Created ${numWorkers} mediasoup workers`);
}

// Socket.IO signaling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinRoom', async ({ roomId, userId }, callback) => {
    let room = rooms.get(roomId);
    if (!room) {
      const worker = getNextWorker();
      const router = await worker.createRouter(mediasoupConfig.router);
      room = { router, participants: new Map(), recordings: new Map(), breakouts: new Map() };
      rooms.set(roomId, room);
      // Publish to Redis for scaling
      redis.publish('roomCreated', JSON.stringify({ roomId }));
    }
    room.participants.set(socket.id, { userId, transports: {}, producers: {}, consumers: {} });
    socket.join(roomId);
    callback({ rtpCapabilities: room.router.rtpCapabilities });
  });

  socket.on('createTransport', async ({ direction, roomId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback({ error: 'Room not found' });

    const transport = await room.router.createWebRtcTransport(mediasoupConfig.webRtcTransport);
    const participant = room.participants.get(socket.id);
    participant.transports[direction] = transport;

    callback({
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters
    });
  });

  socket.on('connectTransport', async ({ transportId, dtlsParameters, roomId }, callback) => {
    const room = rooms.get(roomId);
    const transport = findTransportById(room, transportId);
    if (transport) {
      await transport.connect({ dtlsParameters });
      callback({ connected: true });
    } else {
      callback({ error: 'Transport not found' });
    }
  });

  socket.on('produce', async ({ kind, rtpParameters, roomId }, callback) => {
    const room = rooms.get(roomId);
    const participant = room.participants.get(socket.id);
    const transport = participant.transports.send;
    const producer = await transport.produce({ kind, rtpParameters });
    participant.producers[kind] = producer;

    // Notify other participants to consume
    socket.to(roomId).emit('newProducer', { producerId: producer.id, kind, userId: participant.userId });

    callback({ id: producer.id });
  });

  socket.on('consume', async ({ producerId, rtpCapabilities, roomId }, callback) => {
    const room = rooms.get(roomId);
    const participant = room.participants.get(socket.id);
    const transport = participant.transports.recv;

    if (room.router.canConsume({ producerId, rtpCapabilities })) {
      const consumer = await transport.consume({ producerId, rtpCapabilities, paused: true });
      participant.consumers[producerId] = consumer;

      callback({
        id: consumer.id,
        producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters
      });
    } else {
      callback({ error: 'Cannot consume' });
    }
  });

  // Implement other events: resumeConsumer, pauseProducer, etc.

  // Screen sharing (similar to produce but with appData)
  socket.on('shareScreen', async ({ rtpParameters, roomId }, callback) => {
    // Similar to produce, but with appData: { screen: true }
  });

  // Captions (mock)
  socket.on('sendCaption', ({ text, roomId }) => {
    io.in(roomId).emit('newCaption', { text });
  });

  // Recording
  socket.on('startRecording', async ({ roomId }, callback) => {
    const room = rooms.get(roomId);
    // Use mediasoup-record (assume integrated)
    // Example: const recorder = await startRecording(room.router);
    // room.recordings.set('main', recorder);
    callback({ started: true });
  });

  // Breakout rooms
  socket.on('createBreakout', async ({ breakoutId, roomId }, callback) => {
    const mainRoom = rooms.get(roomId);
    const worker = getNextWorker();
    const router = await worker.createRouter(mediasoupConfig.router);
    const breakout = { router, participants: new Map() };
    mainRoom.breakouts.set(breakoutId, breakout);
    callback({ success: true });
  });

  // Chat, reactions, hand raise, polls, Q&A - use socket.emit and broadcast
  socket.on('chatMessage', ({ message, roomId }) => {
    io.in(roomId).emit('chatMessage', { from: socket.id, message });
  });

  // ... Add more for reactions, etc.

  socket.on('disconnect', () => {
    // Clean up transports, producers, consumers
    for (const [roomId, room] of rooms) {
      const participant = room.participants.get(socket.id);
      if (participant) {
        // Close all
        Object.values(participant.transports).forEach(t => t.close());
        Object.values(participant.producers).forEach(p => p.close());
        Object.values(participant.consumers).forEach(c => c.close());
        room.participants.delete(socket.id);
        if (room.participants.size === 0) rooms.delete(roomId);
        break;
      }
    }
  });
});

// Helper functions
function getNextWorker() {
  const worker = workers[nextWorkerIndex];
  nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;
  return worker;
}

function findTransportById(room, id) {
  for (const participant of room.participants.values()) {
    for (const transport of Object.values(participant.transports)) {
      if (transport.id === id) return transport;
    }
  }
}

// Redis sub for scaling (e.g., room events across instances)
redis.subscribe('roomCreated', (channel, message) => {
  // Sync rooms if needed
});

// Start server
initWorkers().then(() => {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running on port ${port}`));
});

// HTTPS in production: Use nginx reverse proxy in docker
