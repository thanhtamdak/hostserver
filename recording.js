/* recording.js */
const rtpCapabilities = router.rtpCapabilities;
const consumer = await plainTransport.consume({ producerId: producer.id, rtpCapabilities: rtpCapabilities, paused: false });


// ffmpeg command to receive RTP (example for opus + vp8). Adjust codecs and parameters per your producers.
const filename = `${outDir}/record_${producer.id}_${Date.now()}.mkv`;


// Build ffmpeg input arguments to listen to UDP ports published by plainTransport
// WARNING: exact input mapping depends on how your transport tuple provides ports. This is an illustrative example.
const ffmpegArgs = [
// audio input
'-f', 'opus', '-i', `udp://${transportInfo.ip}:${transportInfo.port}`,
// map and encode to file
'-c:a', 'copy',
filename
];


const ff = spawn('ffmpeg', ffmpegArgs);
ff.stderr.on('data', (d) => console.log('[ffmpeg]', d.toString()));
ff.on('exit', (code) => console.log(`ffmpeg exited ${code}`));


return { plainTransport, consumer, ffProcess: ff, filename };
}


async function stopRecording(recording){
try{
if(recording.consumer) await recording.consumer.close();
if(recording.plainTransport) await recording.plainTransport.close();
if(recording.ffProcess) recording.ffProcess.kill('SIGINT');
}catch(e){console.warn(e);}
}


module.exports = { startRecordingForProducer, stopRecording };


// -------------------- activeSpeaker.js (server-side) --------------------
// Use mediasoup's AudioLevelObserver to watch audio levels and emit 'dominant-speaker' events to room clients.
