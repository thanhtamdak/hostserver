// src/components/ControlBar.tsx - Bottom control bar matching Google Meet
import { Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare, Users, MoreHorizontal, LogOut } from 'lucide-react';
import { Button } from 'shadcn/ui/button'; // Assume shadcn imported
import { Tooltip } from 'shadcn/ui/tooltip';

interface ControlBarProps {
  isMuted: boolean;
  toggleMute: () => void;
  isCameraOff: boolean;
  toggleCamera: () => void;
  isSharing: boolean;
  toggleShare: () => void;
  toggleChat: () => void;
  togglePeople: () => void;
  toggleActivities: () => void;
  leaveRoom: () => void;
  timer: string;
}

const ControlBar = ({ isMuted, toggleMute, ...props }: ControlBarProps) => {
  return (
    <div className="bg-gray-800 h-16 flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <span className="text-sm">{props.timer}</span>
        <span className="text-sm">| Daily Standup</span>
      </div>
      <div className="flex space-x-2">
        <Tooltip content={isMuted ? 'Unmute' : 'Mute'}>
          <Button variant="ghost" className={isMuted ? 'text-red-500' : ''} onClick={toggleMute}>
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
        </Tooltip>
        <Tooltip content={isCameraOff ? 'Start video' : 'Stop video'}>
          <Button variant="ghost" className={isCameraOff ? 'text-red-500' : ''} onClick={props.toggleCamera}>
            {isCameraOff ? <VideoOff /> : <Video />}
          </Button>
        </Tooltip>
        <Tooltip content="Share screen">
          <Button variant="ghost" onClick={props.toggleShare}><ScreenShare /></Button>
        </Tooltip>
        <Tooltip content="Chat">
          <Button variant="ghost" onClick={props.toggleChat}><MessageSquare /></Button>
        </Tooltip>
        <Tooltip content="People">
          <Button variant="ghost" onClick={props.togglePeople}><Users /></Button>
        </Tooltip>
        <Tooltip content="Activities">
          <Button variant="ghost" onClick={props.toggleActivities}><MoreHorizontal /></Button>
        </Tooltip>
      </div>
      <Button variant="destructive" onClick={props.leaveRoom}><LogOut /> Leave</Button>
    </div>
  );
};

export default ControlBar;
