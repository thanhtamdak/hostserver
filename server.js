const os = require('os');
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mediasoup = require('mediasoup');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');


const app = express();
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 3000;


// ---------------- mediasoup config ----------------
const mediaCodecs = [
{ kind: 'audio', mimeType: 'audio/opus', clockRate: 48000, channels: 2 },
{ kind: 'video', mimeType: 'video/VP8', clockRate: 90000 }
// Add VP9/H264 if you need
];


const mediasoupConfig = {
worker: {
rtcMinPort: 20000,
rtcMaxPort: 20200,
logLevel: 'warn',
logTags: ['info','ice','dtls','rtp','srtp','rtcp']
},
router: { mediaCodecs },
webRtcTransport: {
listenIps: [ { ip: '0.0.0.0', announcedIp: process.env.ANNOUNCED_IP || null } ],
enableUdp: true,
enableTcp: true,
preferUdp: true,
initialAvailableOutgoingBitrate: 1000000
}
};


let worker = null;
