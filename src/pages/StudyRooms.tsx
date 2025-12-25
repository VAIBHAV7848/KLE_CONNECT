import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import {
  GraduationCap, Users, Video, Mic, MicOff, VideoOff,
  PhoneOff, Copy, Settings, CheckCircle2, Info, MonitorUp, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Agora Imports
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useLocalScreenTrack,
  usePublish,
  useRTCClient,
  useRemoteUsers,
  RemoteUser,
  LocalUser
} from "agora-rtc-react";

/**
 * CONFIGURATION
 */
const APP_ID = "bb21d68abe3449f9b90944ee33253fa5";
// const TOKEN = null; // Replaced by dynamic token fetching
const TOKEN_SERVER_URL = "https://kle-token-server.onrender.com";

type ViewState = 'lobby' | 'prejoin' | 'meeting';

const StudyRooms = () => {
  const [view, setView] = useState<ViewState>('lobby');
  const [roomCode, setRoomCode] = useState("");

  // User Preferences (passed from PreJoin to Meeting)
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const client = useRTCClient(AgoraRTC.createClient({ codec: "vp8", mode: "rtc" }));
  const location = useLocation();

  // Handle URL Deep Linking
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('channel');
    if (code) {
      setRoomCode(code);
      setView('prejoin');
    }
  }, [location]);

  return (
    <AgoraRTCProvider client={client}>
      {view === 'lobby' && (
        <Lobby
          onJoin={(code) => {
            setRoomCode(code);
            setView('prejoin');
          }}
        />
      )}

      {view === 'prejoin' && (
        <PreJoinRoom
          roomCode={roomCode}
          micOn={micOn}
          setMicOn={setMicOn}
          cameraOn={cameraOn}
          setCameraOn={setCameraOn}
          onJoinNow={() => setView('meeting')}
          onBack={() => setView('lobby')}
        />
      )}

      {view === 'meeting' && (
        <LiveMeeting
          roomCode={roomCode}
          initialMic={micOn}
          initialCam={cameraOn}
          onLeave={() => {
            setView('lobby');
            setRoomCode("");
          }}
        />
      )}
    </AgoraRTCProvider>
  );
};

// ==========================================
// 1. LOBBY VIEW (Home)
// ==========================================
const Lobby = ({ onJoin }: { onJoin: (code: string) => void }) => {
  const [inputCode, setInputCode] = useState("");

  const createInstantMeeting = () => {
    // Generate a UUID for unique channel names
    const code = crypto.randomUUID();
    onJoin(code);
  };

  return (
    <PageLayout>
      <PageHeader
        icon={GraduationCap}
        title="Study Rooms"
        subtitle="High-quality video calls for study groups"
        gradient="linear-gradient(135deg, hsl(330 80% 55% / 0.3), hsl(330 80% 55% / 0.1))"
      />

      <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto mt-12 items-center justify-center p-4">
        {/* Hero Section */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display text-foreground">
            Premium Video Meetings. <br />
            <span className="text-primary">Now Free for Students.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect, collaborate, and study together with secure video conferencing using Agora.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center md:justify-start">
            <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" onClick={createInstantMeeting}>
              <Video className="mr-2 w-5 h-5" />
              New Meeting
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Enter a code or link"
                  className="h-12 pl-10 pr-4 rounded-lg bg-background border border-input focus:ring-2 focus:ring-primary/20 outline-none w-full transition-all"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="h-12 px-6 hover:bg-accent/10"
                disabled={!inputCode.trim()}
                onClick={() => onJoin(inputCode.trim())}
              >
                Join
              </Button>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 w-full max-w-md mx-auto md:mx-0">
            <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
              <Info className="w-4 h-4" />
              Learn more about our study rooms
            </p>
          </div>
        </div>

        {/* Illustration / Image */}
        <div className="flex-1 w-full max-w-md hidden md:block">
          <div className="aspect-square rounded-full bg-gradient-to-tr from-primary/20 via-accent/10 to-transparent p-12 relative animate-slow-spin">
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Mock Grid */}
              <div className="grid grid-cols-2 gap-4 w-64 rotate-[-6deg]">
                <div className="h-32 bg-card rounded-2xl shadow-xl border border-white/10 flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div className="h-32 bg-primary/20 rounded-2xl shadow-xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div className="h-32 bg-accent/20 rounded-2xl shadow-xl flex items-center justify-center">
                  <Mic className="w-8 h-8 text-accent" />
                </div>
                <div className="h-32 bg-card rounded-2xl shadow-xl border border-white/10 flex items-center justify-center">
                  <Settings className="w-8 h-8 text-muted-foreground/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

// ==========================================
// 2. PRE-JOIN ROOM (Green Room)
// ==========================================
const PreJoinRoom = (props: {
  roomCode: string,
  micOn: boolean, setMicOn: (v: boolean) => void,
  cameraOn: boolean, setCameraOn: (v: boolean) => void,
  onJoinNow: () => void,
  onBack: () => void
}) => {
  // Local Tracks Hook for Preview
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(props.micOn);
  const { localCameraTrack } = useLocalCameraTrack(props.cameraOn);

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-12 items-center">

        {/* Left: Preview */}
        <div className="flex-1 w-full max-w-xl">
          <div className="relative aspect-video bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            <LocalUser
              audioTrack={localMicrophoneTrack}
              cameraOn={props.cameraOn}
              micOn={props.micOn}
              videoTrack={localCameraTrack}
              cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
            >
              <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                Ready to join
              </div>
            </LocalUser>

            {/* Overlay Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
              <button
                onClick={() => props.setMicOn(!props.micOn)}
                className={`p-4 rounded-full transition-all ${!props.micOn ? 'bg-red-600 hover:bg-red-700 shadow-lg' : 'bg-[#3c4043] hover:bg-[#4b4f52]/80 border border-white/10'}`}
              >
                {props.micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => props.setCameraOn(!props.cameraOn)}
                className={`p-4 rounded-full transition-all ${!props.cameraOn ? 'bg-red-600 hover:bg-red-700 shadow-lg' : 'bg-[#3c4043] hover:bg-[#4b4f52]/80 border border-white/10'}`}
              >
                {props.cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Join Info */}
        <div className="flex-1 space-y-6 text-center md:text-left">
          <h2 className="text-3xl font-display font-medium">Ready to join?</h2>
          <p className="text-gray-400">
            You are about to join room: <span className="text-white font-mono bg-white/10 px-2 py-1 rounded select-all">{props.roomCode}</span>
          </p>

          <div className="flex flex-col gap-3 max-w-xs mx-auto md:mx-0">
            <Button size="lg" className="rounded-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium shadow-blue-500/20 shadow-lg" onClick={props.onJoinNow}>
              Join Now
            </Button>
            <Button variant="ghost" className="rounded-full text-gray-400 hover:text-white hover:bg-white/10" onClick={props.onBack}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. LIVE MEETING VIEW
// ==========================================
const LiveMeeting = (props: {
  roomCode: string,
  initialMic: boolean,
  initialCam: boolean,
  onLeave: () => void
}) => {
  const [micOn, setMicOn] = useState(props.initialMic);
  const [cameraOn, setCameraOn] = useState(props.initialCam);
  const [screenShareOn, setScreenShareOn] = useState(false);

  const { toast } = useToast();

  // Connection Hooks
  const [token, setToken] = useState<string | null>(null);
  const [uid] = useState<number>(() => Math.floor(Math.random() * 1000000));

  // Fetch Token from Backend (DISABLED FOR DIRECT CONNECTION)
  // To restore security: Uncomment this useEffect and ensure backend is running.
  /*
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(`${TOKEN_SERVER_URL}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: props.roomCode, uid: uid }),
        });

        if (!response.ok) throw new Error("Failed to get token");
        
        const data = await response.json();
        setToken(data.token);
      } catch (error) {
        console.error("Token fetch error:", error);
        // Explicitly alert the user to the failure cause
        // alert(`Connection Failed: ...`); 
        toast({
          title: "Connection Error",
          description: "Could not connect to server. Retrying...",
          variant: "destructive",
        });
      }
    };

    if (props.roomCode) {
      fetchToken();
    }
  }, [props.roomCode, uid, toast]);
  */

  // DIRECT CONNECTION MODE (No Security)
  // Ensure your Agora Project is set to "APP ID ONLY" in the console.
  const { isConnected } = useJoin(
    { appid: APP_ID, channel: props.roomCode, token: null, uid: uid },
    true // Always ready to join
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  const { screenTrack, error: screenError } = useLocalScreenTrack(screenShareOn, {}, "disable");

  // Handle Screen Share Stop (via browser UI)
  useEffect(() => {
    if (screenShareOn && screenTrack) {
      screenTrack.on("track-ended", () => {
        setScreenShareOn(false);
      });
    }
  }, [screenShareOn, screenTrack]);

  usePublish([localMicrophoneTrack, localCameraTrack, screenShareOn ? screenTrack : null]);

  const remoteUsers = useRemoteUsers();

  return (
    <div className="h-screen w-full bg-[#202124] text-white flex flex-col overflow-hidden fixed top-0 left-0 z-50">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-10 absolute top-0 w-full">
        <div className="flex items-center gap-3">
          <span className="text-lg font-medium tracking-wide font-mono">{props.roomCode.substring(0, 8)}...</span>
          {isConnected ? (
            <div className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-md font-mono border border-green-500/20 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              LIVE
            </div>
          ) : (
            <div className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-md font-mono border border-yellow-500/20 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              CONNECTING
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">{remoteUsers.length + 1}</span>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto bg-[#202124] pt-20 pb-24">
        {/* You (Camera) */}
        {!screenShareOn && (
          <div className="relative bg-[#3c4043] rounded-xl overflow-hidden border-2 border-blue-500/0 aspect-video group shadow-lg">
            <LocalUser
              audioTrack={localMicrophoneTrack}
              cameraOn={cameraOn}
              micOn={micOn}
              videoTrack={localCameraTrack}
              cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
            >
              <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-sm font-medium z-10">
                You
              </div>
            </LocalUser>
          </div>
        )}

        {/* You (Screen Share) */}
        {screenShareOn && screenTrack && (
          <div className="relative bg-[#3c4043] rounded-xl overflow-hidden border-2 border-blue-500 aspect-video group shadow-lg col-span-2 row-span-2">
            <LocalUser
              audioTrack={localMicrophoneTrack}
              cameraOn={false}
              micOn={micOn}
              videoTrack={screenTrack}
              cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg"
            >
              <div className="absolute bottom-3 left-3 bg-blue-600 px-2 py-1 rounded text-sm font-medium z-10 flex items-center gap-2">
                <MonitorUp className="w-3 h-3" /> You are presenting
              </div>
            </LocalUser>
          </div>
        )}

        {/* Others */}
        {remoteUsers.map((user) => (
          <div key={user.uid} className={`relative bg-[#3c4043] rounded-xl overflow-hidden aspect-video shadow-lg ${user.hasVideo ? '' : 'flex items-center justify-center'}`}>
            <RemoteUser cover="https://www.agora.io/en/wp-content/uploads/2022/10/3d-spatial-audio-icon.svg" user={user}>
              <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-sm font-medium z-10">
                Student {user.uid}
              </div>
            </RemoteUser>
          </div>
        ))}

        {remoteUsers.length === 0 && isConnected && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center p-8 text-center text-gray-500 h-64 border-2 border-dashed border-gray-700 rounded-xl">
            <div className="max-w-sm">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
              <p className="text-lg font-medium text-gray-300">Waiting for friends...</p>
              <p className="text-sm mt-2">Share the link to invite them to this room.</p>
              <p className="font-mono text-xs mt-4 bg-black/20 p-2 rounded select-all">{props.roomCode}</p>
            </div>
          </div>
        )}

        {remoteUsers.length === 0 && !isConnected && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center justify-center p-8 text-center text-gray-500 h-64">
            <p>Connecting to server...</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="h-20 bg-[#202124] flex items-center justify-center gap-4 px-4 z-20 absolute bottom-0 w-full shadow-2xl border-t border-white/5">
        <button
          onClick={() => setMicOn(!micOn)}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${!micOn ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3c4043] hover:bg-[#4b4f52]'}`}
          title="Toggle Microphone"
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setCameraOn(!cameraOn)}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${!cameraOn ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3c4043] hover:bg-[#4b4f52]'}`}
          title="Toggle Camera"
        >
          {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setScreenShareOn(!screenShareOn)}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${screenShareOn ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-[#3c4043] hover:bg-[#4b4f52] text-gray-200'}`}
          title="Share Screen"
        >
          <MonitorUp className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-gray-600 mx-2" />

        <button
          onClick={() => {
            // Fix: Include pathname to support subdirectories (like /KLE_CONNECT/)
            const link = `${window.location.origin}${window.location.pathname}#/study-rooms?channel=${props.roomCode}`;
            navigator.clipboard.writeText(link);
            toast({ title: "Copied joining info", description: "Meeting link copied to clipboard" });
          }}
          className="h-12 w-12 rounded-full bg-[#3c4043] hover:bg-[#4b4f52] flex items-center justify-center text-blue-400 transition-colors"
          title="Copy Link"
        >
          <Copy className="w-5 h-5" />
        </button>

        <button
          onClick={props.onLeave}
          className="h-12 px-8 rounded-full bg-red-600 hover:bg-red-700 flex items-center font-medium gap-2 transition-colors ml-4"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">Leave call</span>
        </button>
      </div>
    </div>
  );
};

export default StudyRooms;
