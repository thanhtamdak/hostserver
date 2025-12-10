// src/lib/mediasoupClient.ts - Client-side mediasoup
import { Device, Transport } from 'mediasoup-client';

// Export Device, etc. for use in page
// Implement helper functions if needed
export async function createSendTransport(device: Device, socket: any, roomId: string): Promise<Transport> {
  return new Promise((resolve) => {
    socket.emit('createTransport', { direction: 'send', roomId }, (params) => {
      const transport = device.createSendTransport(params);
      // Add connect/produce handlers as in page.tsx
      resolve(transport);
    });
  });
}

// Similar for recvTransport
