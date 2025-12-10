// src/app/room/[code]/page.tsx - Main meeting room
'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import io from 'socket.io-client';
import { Device } from 'mediasoup-client';
import ControlBar from '@/components/ControlBar';
import Grid from '@/components/Grid';
import Sidebar from '@/components/Sidebar';
import Chat from '@/components/Chat';
import People from '@/components/People';
import Whiteboard from '@/components/Whiteboard';
import { useAuthStore } from '@/hooks/useAuthStore'; // Assume implemented

const RoomPage = () => {
  const params = useParams();
  const code = params.code as string;
  const socket = useRef(io());
  const device = useRef(new Device());
  const [producers, setProducers] = useState({});
  const [consumers, setConsumers] = useState({});
  const [streams, setStreams] = useState({}); // userId -> stream
  const [viewMode, setViewMode] = useState('grid'); // grid, speaker, pinned
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Join room
    socket.current.emit('joinRoom', { roomId: code, userId: user.id }, async ({ rtpCapabilities }) => {
      await device.current.load({ routerRtpCapabilities: rtpCapabilities });

      // Create send transport
      socket.current.emit('createTransport', { direction: 'send', roomId: code }, async (params) => {
        const transport = device.current.createSendTransport(params);
        transport.on('connect', ({ dtlsParameters }, callback) => {
          socket.current.emit('connectTransport', { transportId: transport.id, dtlsParameters, roomId: code }, callback);
        });
        transport.on('produce', async ({ kind, rtpParameters }, callback) => {
          socket.current.emit('produce', { kind, rtpParameters, roomId: code }, ({ id }) => callback({ id }));
        });

        // Get local stream
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStream.getTracks().forEach(async (track) => {
          const producer = await transport.produce({ track });
          setProducers((prev) => ({ ...prev, [track.kind]: producer }));
        });
        setStreams((prev) => ({ ...prev, [user.id]: localStream }));
      });

      // Create recv transport
      socket.current.emit('createTransport', { direction: 'recv', roomId: code }, (params) => {
        const transport = device.current.createRecvTransport(params);
        transport.on('connect', ({ dtlsParameters }, callback) => {
          socket.current.emit('connectTransport', { transportId: transport.id, dtlsParameters, roomId: code }, callback);
        });
      });
    });

    // Listen for new producers
    socket.current.on('newProducer', async ({ producerId, kind, userId }) => {
      socket.current.emit('consume', { producerId, rtpCapabilities: device.current.rtpCapabilities, roomId: code }, async (params) => {
        const transport = // get recv transport
        const consumer = await transport.consume(params);
        const stream = new MediaStream([consumer.track]);
        setStreams((prev) => ({ ...prev, [userId]: stream }));
        setConsumers((prev) => ({ ...prev, [producerId]: consumer }));
        await socket.current.emit('resumeConsumer', { consumerId: consumer.id, roomId: code });
      });
    });

    // Cleanup
    return () => { socket.current.disconnect(); };
  }, [code, user.id]);

  // Virtual background (BodyPix)
  useEffect(() => {
    // Load BodyPix and apply blur/background
    // Example code using @tensorflow-models/body-pix
  }, []);

  // Noise suppression (RNNoise)
  useEffect(() => {
    // Integrate RNNoise WASM for audio processing
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-white font-roboto flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <Grid streams={streams} viewMode={viewMode} />
        {chatOpen && <Chat socket={socket} roomId={code} />}
        {peopleOpen && <People socket={socket} roomId={code} />}
        {activitiesOpen && <Sidebar><Whiteboard /></Sidebar>}
      </div>
      <ControlBar
        isMuted={isMuted} toggleMute={() => setIsMuted(!isMuted)}
        isCameraOff={isCameraOff} toggleCamera={() => setIsCameraOff(!isCameraOff)}
        isSharing={isSharing} toggleShare={() => {/* implement */}}
        toggleChat={() => setChatOpen(!chatOpen)}
        togglePeople={() => setPeopleOpen(!peopleOpen)}
        toggleActivities={() => setActivitiesOpen(!activitiesOpen)}
        leaveRoom={() => {/* implement */}}
        timer="00:00:00" // Implement timer
      />
    </div>
  );
};

export default RoomPage;
