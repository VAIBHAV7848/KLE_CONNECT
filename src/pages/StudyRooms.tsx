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
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useLocalScreenTrack,
  usePublish,
  useRTCClient,
  useRemoteUsers,
  useVolumeLevel,
  RemoteUser,
  LocalUser
} from "agora-rtc-react";
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CONFIGURATION
 */
const APP_ID = (import.meta.env.VITE_AGORA_APP_ID || "").trim();
const TOKEN_SERVER_URL = (import.meta.env.VITE_TOKEN_SERVER_URL || "").trim();

// Diagnostic Log for Developer Console
if (typeof window !== 'undefined') {
  console.log("🛠️ Agora Config Check:", {
    hasAppId: !!APP_ID,
    appIdLength: APP_ID.length,
    hasTokenServer: !!TOKEN_SERVER_URL,
    tokenServerLength: TOKEN_SERVER_URL.length
  });
}

type ViewState = 'lobby' | 'prejoin' | 'meeting';

const SpeakingAura = ({ volume }: { volume: number }) => {
  return (
    <AnimatePresence>
      {volume > 5 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            borderWidth: [2, 8, 2]
          }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full border-blue-500/50 bg-blue-500/10 pointer-events-none z-0"
          style={{ width: '110%', height: '110%', left: '-5%', top: '-5%' }}
        />
      )}
    </AnimatePresence>
  );
};

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
// ==========================================
// 1. LOBBY VIEW (Home)
// ==========================================
const Lobby = ({ onJoin }: { onJoin: (code: string) => void }) => {
  const [inputCode, setInputCode] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomTopic, setNewRoomTopic] = useState("");

  // Custom Room State
  const [rooms, setRooms] = useState<{ id: string, name: string, topic: string, participants: number }[]>([]);

  useEffect(() => {
    // Load saved rooms or defaults
    const saved = localStorage.getItem('custom-study-rooms');
    if (saved) {
      setRooms(JSON.parse(saved));
    } else {
      setRooms([]);
    }
  }, []);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    const newRoom = {
      id: crypto.randomUUID(),
      name: newRoomName,
      topic: newRoomTopic,
      participants: 1 // Starts with you
    };
    const updated = [newRoom, ...rooms];
    setRooms(updated);
    localStorage.setItem('custom-study-rooms', JSON.stringify(updated));
    setIsCreateOpen(false);
    onJoin(newRoom.name); // Join immediately
  };

  return (
    <PageLayout>
      <PageHeader
        icon={GraduationCap}
        title="Study Rooms"
        subtitle="Join live study sessions or create your own"
        gradient="linear-gradient(135deg, hsl(330 80% 55% / 0.3), hsl(330 80% 55% / 0.1))"
      />

      <div className="max-w-6xl mx-auto mt-8 px-4">

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold font-display">Live Rooms</h2>
            <p className="text-muted-foreground">Happening now across campus</p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                placeholder="Enter room code..."
                className="w-full h-10 px-3 rounded-lg bg-muted text-sm border border-transparent focus:border-primary outline-none"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
              />
            </div>
            <Button
              disabled={!inputCode}
              onClick={() => onJoin(inputCode)}
              variant="secondary"
            >
              Join
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-primary text-white">
              <Video className="w-4 h-4" /> Create Room
            </Button>
          </div>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="glass p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden">
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>LIVE</span>
              </div>

              <div className="mb-4">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{room.topic}</span>
                <h3 className="text-xl font-bold mt-1 group-hover:text-primary transition-colors">{room.name}</h3>
              </div>

              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{room.participants} studying</span>
                </div>
                <Button size="sm" onClick={() => onJoin(room.name)}>Join Room</Button>
              </div>
            </div>
          ))}

          {rooms.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-xl">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No live rooms right now</h3>
              <p className="text-muted-foreground mb-4">Be the first to start a study session!</p>
              <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create a Room</Button>
            </div>
          )}
        </div>

        {/* Create Room Modal (Simple Overlay for now) */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold mb-4">Create New Room</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Name</label>
                  <input
                    autoFocus
                    className="w-full p-3 rounded-lg bg-muted border border-transparent focus:border-primary outline-none"
                    placeholder="e.g. Exam Prep Group"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject / Topic</label>
                  <input
                    className="w-full p-3 rounded-lg bg-muted border border-transparent focus:border-primary outline-none"
                    placeholder="e.g. Data Structures"
                    value={newRoomTopic}
                    onChange={e => setNewRoomTopic(e.target.value)}
                  />
                  {/* Engineering Suggestions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Data Structures", "VLSI Design", "Thermodynamics", "Machine Learning", "Control Systems"].map(sub => (
                      <button
                        key={sub}
                        onClick={() => {
                          setNewRoomTopic(sub);
                          if (!newRoomName) setNewRoomName(`${sub} Study Group`);
                        }}
                        className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateRoom} disabled={!newRoomName.trim() || !newRoomTopic.trim()}>Create & Join</Button>
                </div>
              </div>
            </div>
          </div>
        )}

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
  const { user } = useAuth();
  const userEmail = user?.email || user?.phoneNumber || "Student";
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`;

  // Local Tracks Hook for Preview - Simplified to avoid browser issues
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(props.micOn);
  const { localCameraTrack } = useLocalCameraTrack(props.cameraOn);

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex flex-col md:flex-row gap-12 items-center">

        {/* Left: Preview */}
        <div className="flex-1 w-full max-w-xl">
          <div className="relative aspect-video bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            {!props.cameraOn ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                <div className="text-center">
                  <Avatar className="w-32 h-32 mx-auto border-4 border-[#3c4043] shadow-2xl">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback>{userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="mt-4 text-gray-400 font-medium tracking-wide">{userEmail}</p>
                </div>
              </div>
            ) : (
              <LocalUser
                cameraOn={props.cameraOn}
                micOn={props.micOn}
                videoTrack={localCameraTrack}
                cover={avatarUrl}
              >
                <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  Ready to join
                </div>
              </LocalUser>
            )}

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
  const { user } = useAuth();
  const [micOn, setMicOn] = useState(props.initialMic);
  const [cameraOn, setCameraOn] = useState(props.initialCam);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const userEmail = user?.email || user?.phoneNumber || "Student";
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`;

  const { toast } = useToast();

  // Connection Hooks
  const [token, setToken] = useState<string | null>(null);
  const [uid] = useState<number>(() => Math.floor(Math.random() * 1000000));
  const appIdMissing = !APP_ID;

  useEffect(() => {
    const fetchToken = async () => {
      // If no token server URL is provided, we skip fetching and stay in 'ready' state
      // (This supports Agora 'App ID only' projects)
      if (!TOKEN_SERVER_URL) {
        console.log("ℹ️ No Token Server configured. Using 'App ID only' mode.");
        setTokenStatus('ready');
        return;
      }

      setToken(null);
      setTokenStatus('loading');

      if (appIdMissing) {
        setTokenStatus('error');
        toast({
          title: "Agora APP_ID missing",
          description: "Set VITE_AGORA_APP_ID in Vercel/Render settings.",
          variant: "destructive",
        });
        return;
      }

      // Sanitize URL
      const baseUrl = TOKEN_SERVER_URL.endsWith('/')
        ? TOKEN_SERVER_URL.slice(0, -1)
        : TOKEN_SERVER_URL;
      const targetUrl = `${baseUrl}/token`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: String(props.roomCode),
            uid: Number(uid)
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        const data = await response.json();
        setToken(data.token);
        setTokenStatus('ready');
      } catch (error: any) {
        console.error("❌ Token fetch failed:", error.message);
        setTokenStatus('error');
        toast({
          title: "Token fetch failed",
          description: "Could not get secure token. Falling back to key-only mode.",
          variant: "destructive",
        });
        // Optional fallback: Uncomment to allow joining even if token server is down
        // setTokenStatus('ready'); 
      }
    };

    if (props.roomCode) {
      fetchToken();
    }
  }, [props.roomCode, uid, appIdMissing]);

  // If no token server is configured, joinReady only needs the APP_ID and roomCode
  const joinReady = Boolean(
    props.roomCode &&
    !appIdMissing &&
    (TOKEN_SERVER_URL ? (token && tokenStatus === 'ready') : (tokenStatus === 'ready'))
  );

  const { isConnected } = useJoin(
    { appid: APP_ID, channel: props.roomCode, token: token || null, uid: uid },
    joinReady
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  // Screen Share Hook
  const { screenTrack, error: screenError } = useLocalScreenTrack(screenShareOn, {}, "disable");

  const localVolume = useVolumeLevel(localMicrophoneTrack);

  // Enable Volume Indicators
  const rtcClient = useRTCClient();
  useEffect(() => {
    rtcClient.enableAudioVolumeIndicator();
  }, [rtcClient]);

  // Handle Screen Share Stop (via browser UI)
  useEffect(() => {
    if (screenShareOn && screenTrack) {
      screenTrack.on("track-ended", () => {
        setScreenShareOn(false);
      });
    }
  }, [screenShareOn, screenTrack]);

  // Publish Logic: Swap Camera with Screen if Sharing
  // Note: Standard Agora only allows 1 video track per user. We must turn off cam video to show screen.
  const tracksToPublish = [localMicrophoneTrack, screenShareOn ? screenTrack : localCameraTrack].filter(Boolean);
  usePublish(tracksToPublish);

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
              ● LIVE
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
        {!joinReady && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
            {tokenStatus === 'loading' && 'Fetching secure token...'}
            {tokenStatus === 'error' && 'Token unavailable. Check token server and APP_ID.'}
            {appIdMissing && 'Agora APP_ID missing. Set VITE_AGORA_APP_ID.'}
          </div>
        )}
        {/* You (Camera) */}
        {!screenShareOn && (
          <div className="relative bg-[#3c4043] rounded-xl overflow-hidden border-2 border-blue-500/0 aspect-video group shadow-lg">
            {!cameraOn ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                <div className="text-center">
                  <div className="relative">
                    <Avatar className="w-24 h-24 mx-auto border-4 border-[#3c4043] shadow-2xl relative z-10">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback>{userEmail.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <SpeakingAura volume={localVolume} />
                  </div>
                  <p className="mt-4 text-gray-400 font-medium">{userEmail}</p>
                </div>
              </div>
            ) : (
              <LocalUser
                cameraOn={cameraOn}
                micOn={micOn}
                videoTrack={localCameraTrack}
                cover={avatarUrl}
              />
            )}
            <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-sm font-medium z-10">
              You
            </div>
          </div>
        )}

        {/* You (Screen Share) */}
        {screenShareOn && screenTrack && (
          <div className="relative bg-[#3c4043] rounded-xl overflow-hidden border-2 border-blue-500 aspect-video group shadow-lg col-span-2 row-span-2">
            <LocalUser
              cameraOn={false}
              micOn={micOn}
              videoTrack={screenTrack}
              cover={avatarUrl}
            >
              <div className="absolute bottom-3 left-3 bg-blue-600 px-2 py-1 rounded text-sm font-medium z-10 flex items-center gap-2">
                <MonitorUp className="w-3 h-3" /> You are presenting
              </div>
            </LocalUser>
          </div>
        )}

        {/* Others */}
        {remoteUsers.map((user) => (
          <div key={user.uid} className="relative bg-[#3c4043] rounded-xl overflow-hidden aspect-video shadow-lg">
            {!user.hasVideo ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#202124]">
                <div className="text-center relative">
                  <div className="relative">
                    <Avatar className="w-20 h-20 mx-auto border-4 border-[#3c4043] relative z-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`} />
                      <AvatarFallback>U{user.uid}</AvatarFallback>
                    </Avatar>
                    <UserVolumeIndicator track={user.audioTrack} />
                  </div>
                  <p className="mt-3 text-sm text-gray-400">Student {user.uid}</p>
                </div>
              </div>
            ) : (
              <RemoteUser cover={`https://api.dicebear.com/7.x/initials/svg?seed=${user.uid}`} user={user} />
            )}
            <div className="absolute bottom-3 left-3 bg-black/50 px-2 py-1 rounded text-sm font-medium z-10">
              Student {user.uid}
            </div>
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

const UserVolumeIndicator = ({ track }: { track: any }) => {
  const volume = useVolumeLevel(track);
  return <SpeakingAura volume={volume} />;
};

export default StudyRooms;
