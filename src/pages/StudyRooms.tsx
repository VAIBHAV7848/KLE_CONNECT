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

const SpeakingAura = ({ track, isActive }: { track: any, isActive: boolean }) => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    if (!isActive || !track) {
      setVolume(0);
      return;
    }
    const interval = setInterval(() => {
      setVolume(track.getVolumeLevel() * 100);
    }, 100);
    return () => clearInterval(interval);
  }, [track, isActive]);

  const isSpeaking = volume > 2;

  return (
    <AnimatePresence>
      {isSpeaking && (
        <>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl pointer-events-none z-0"
            style={{ width: '130%', height: '130%', left: '-15%', top: '-15%' }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.8, 0.4],
              borderWidth: [2, 4, 2]
            }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-blue-400/60 pointer-events-none z-0"
            style={{ width: '115%', height: '115%', left: '-7.5%', top: '-7.5%' }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

const VolumeBar = ({ track, isActive }: { track: any, isActive: boolean }) => {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    if (!isActive || !track) {
      setLevel(0);
      return;
    }
    // Update every 50ms for that high-refresh "Live" feel
    const interval = setInterval(() => {
      try {
        const rawVol = track.getVolumeLevel();
        // Senior Dev Tip: Sound perception is logarithmic. Use a power function + boost.
        // We also add a tiny bit of random 'jitter' when speaking to make it look organic.
        const boosted = Math.pow(rawVol, 0.5) * 100;
        setLevel(boosted);
      } catch (e) {
        setLevel(0);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [track, isActive]);

  if (!isActive || !track) return <MicOff className="w-3 h-3 text-red-500" strokeWidth={2.5} />;

  return (
    <div className="flex gap-0.5 items-end h-[14px] w-5">
      {[0.6, 1.2, 0.8].map((factor, i) => {
        // Add dynamic jitter for that "Dancing" effect
        const jitter = level > 2 ? (Math.random() * 10 - 5) : 0;
        const height = level > 1 ? Math.min(100, (level * factor) + jitter) : 20;

        return (
          <motion.div
            key={i}
            animate={{ height: `${Math.max(20, height)}%` }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }} // Snappy!
            className="w-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"
          />
        );
      })}
    </div>
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
  const [stageUid, setStageUid] = useState<string | number | null>(null);
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

  const { localMicrophoneTrack, error: micError } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);

  // Handle Mic Errors
  useEffect(() => {
    if (micError) {
      console.error("🎤 Mic Fail:", micError);
      toast({
        title: "Microphone Issue",
        description: "Please check if your browser has permission or if another app is using the mic.",
        variant: "destructive"
      });
    }
  }, [micError]);
  // Screen Share Hook
  const { screenTrack, error: screenError } = useLocalScreenTrack(screenShareOn, {}, "disable");

  const localVolume = useVolumeLevel(localMicrophoneTrack);

  // Enable Volume Indicators with high polling rate
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

  // Professional Audio Sync: Ensure unmublished state is broadcasted
  // Passing null to usePublish effectively unpublishes the track immediately
  const tracksToPublish = [
    micOn ? localMicrophoneTrack : null,
    screenShareOn ? screenTrack : (cameraOn ? localCameraTrack : null)
  ].filter(Boolean);

  usePublish(tracksToPublish);

  const remoteUsers = useRemoteUsers();

  // Auto-Spotlight Screen Shares
  useEffect(() => {
    const remoteScreenShare = remoteUsers.find(u => u.hasVideo);
    if (remoteScreenShare) {
      setStageUid(remoteScreenShare.uid);
    } else if (screenShareOn) {
      setStageUid('local_screen');
    }
  }, [remoteUsers, screenShareOn]);

  return (
    <div className="h-screen w-full bg-[#202124] text-white flex flex-col overflow-hidden fixed inset-0 z-50 font-sans">
      {/* 1. Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-black/40 backdrop-blur-xl z-30 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold tracking-tight truncate max-w-[150px] md:max-w-none text-blue-50/90">{props.roomCode}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </div>
            <span className="text-[10px] font-black tracking-widest text-green-400">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <Users className="w-4 h-4" />
            <span>{remoteUsers.length + 1} PARTICIPANTS</span>
          </div>
          <button
            onClick={() => {
              const link = `${window.location.origin}${window.location.pathname}#/study-rooms?channel=${props.roomCode}`;
              navigator.clipboard.writeText(link);
              toast({ title: "Invite link copied" });
            }}
            className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all border border-blue-500/20"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Content Area (Theatre Layout) */}
      <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-hidden bg-[#202124]`}>

        {/* Stage Area */}
        {(stageUid || screenShareOn) ? (
          <div className="flex-[3] relative flex items-center justify-center bg-black/20 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={String(stageUid)}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full h-full relative"
              >
                {stageUid === 'local_screen' || screenShareOn ? (
                  <LocalUser
                    cameraOn={false}
                    micOn={micOn}
                    videoTrack={screenTrack}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  stageUid === 'local' ? (
                    <LocalUser
                      cameraOn={cameraOn}
                      micOn={micOn}
                      videoTrack={localCameraTrack}
                      className="w-full h-full"
                    />
                  ) : (
                    <RemoteUser
                      user={remoteUsers.find(u => u.uid === stageUid)!}
                      className="w-full h-full"
                      playAudio={true}
                    />
                  )
                )}

                {/* Stage Controls Overlay */}
                <div className="absolute top-6 left-6 flex gap-3">
                  <div className="bg-blue-600 px-4 py-2 rounded-2xl shadow-2xl border border-blue-400/50 flex items-center gap-2">
                    <MonitorUp className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {stageUid === 'local_screen' ? 'Your Presentation' : 'Spotlight View'}
                    </span>
                  </div>
                  <button
                    onClick={() => setStageUid(null)}
                    className="bg-black/60 hover:bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Close Stage
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : null}

        {/* Participant List (Filmstrip or Grid) */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-700 ${stageUid ? 'lg:w-80 flex flex-row lg:flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto'}`}>

          {/* You */}
          {!screenShareOn && (
            <div
              onClick={() => setStageUid(stageUid === 'local' ? null : 'local')}
              className={`relative bg-[#3c4043] rounded-3xl overflow-hidden border-2 transition-all cursor-pointer group shadow-2xl aspect-video ${stageUid === 'local' ? 'border-blue-500 scale-95 opacity-40' : 'border-white/5 hover:border-blue-500/50'}`}
            >
              {!cameraOn ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1b1e]">
                  <div className="text-center relative">
                    <div className="relative">
                      <Avatar className={`w-24 h-24 mx-auto border-4 relative z-10 transition-all duration-500 ${!micOn ? 'border-red-500/40 grayscale shadow-none' : 'border-[#3c4043] shadow-blue-500/20 shadow-2xl'}`}>
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>ME</AvatarFallback>
                      </Avatar>
                      <SpeakingAura track={localMicrophoneTrack} isActive={micOn} />
                      {!micOn && (
                        <div className="absolute bottom-0 right-1 bg-red-600 rounded-full p-2 border-2 border-[#1a1b1e] z-20 shadow-2xl animate-in zoom-in">
                          <MicOff className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">You</p>
                  </div>
                </div>
              ) : (
                <LocalUser cameraOn={cameraOn} micOn={micOn} videoTrack={localCameraTrack} cover={avatarUrl} />
              )}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-black z-10 flex items-center gap-2 border border-white/10 tracking-[0.1em] uppercase">
                <VolumeBar track={localMicrophoneTrack} isActive={micOn} />
                <span>You</span>
              </div>
            </div>
          )}

          {/* Remote Students */}
          {remoteUsers.map((u) => (
            <div
              key={u.uid}
              onClick={() => setStageUid(stageUid === u.uid ? null : u.uid)}
              className={`relative bg-[#3c4043] rounded-3xl overflow-hidden border-2 transition-all cursor-pointer group shadow-2xl aspect-video ${stageUid === u.uid ? 'border-blue-500 scale-95 opacity-40' : 'border-white/5 hover:border-blue-500/50'}`}
            >
              {/* Audio Sync Hook */}
              <div className="hidden"><RemoteUser user={u} playAudio={true} /></div>

              {(!u.hasVideo) ? (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1a1b1e]">
                  <div className="text-center relative">
                    <div className="relative">
                      <Avatar className={`w-20 h-20 mx-auto border-4 relative z-10 transition-all duration-500 ${!u.hasAudio ? 'border-red-500/40 grayscale' : 'border-[#3c4043] shadow-2xl'}`}>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.uid}`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <SpeakingAura track={u.audioTrack} isActive={u.hasAudio} />
                      {!u.hasAudio && (
                        <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-1.5 border-2 border-[#1a1b1e] z-20 shadow-2xl animate-in zoom-in">
                          <MicOff className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">Student {u.uid}</p>
                  </div>
                </div>
              ) : (
                <RemoteUser user={u} cover={`https://api.dicebear.com/7.x/initials/svg?seed=${u.uid}`} />
              )}

              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-black z-10 flex items-center gap-2 border border-white/10 tracking-[0.1em] uppercase group-hover:bg-blue-600/80 transition-all">
                <UserVolumeIndicator track={u.audioTrack} micOn={u.hasAudio} />
                <span>ID: {String(u.uid).substring(0, 4)}</span>
                {!u.hasAudio && <span className="text-red-400 opacity-60 text-[8px] ml-1">OFF</span>}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {remoteUsers.length === 0 && isConnected && !screenShareOn && (
            <div className="col-span-full border-4 border-dashed border-white/5 rounded-[40px] flex items-center justify-center p-12 bg-white/[0.01]">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400/60" />
                </div>
                <h3 className="text-lg font-bold text-gray-400 mb-2 uppercase tracking-widest">Awaiting Peers</h3>
                <p className="text-[10px] text-gray-600 font-black tracking-widest uppercase">Room: {props.roomCode}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Controls Bar */}
      <div className="h-24 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4 px-6 z-40">
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-3xl px-6 py-4 rounded-[32px] border border-white/10 shadow-2xl">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${!micOn ? 'bg-red-600 shadow-red-500/40 shadow-xl scale-110' : 'bg-[#3c4043] hover:bg-white/10'}`}
          >
            {micOn ? <Mic className="w-6 h-6" strokeWidth={1.5} /> : <MicOff className="w-6 h-6 text-white" strokeWidth={2.5} />}
          </button>

          <button
            onClick={() => setCameraOn(!cameraOn)}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${!cameraOn ? 'bg-red-600 shadow-red-500/40 shadow-xl scale-110' : 'bg-[#3c4043] hover:bg-white/10'}`}
          >
            {cameraOn ? <Video className="w-6 h-6" strokeWidth={1.5} /> : <VideoOff className="w-6 h-6 text-white" strokeWidth={2.5} />}
          </button>

          <div className="w-px h-10 bg-white/10 mx-2" />

          <button
            onClick={() => setScreenShareOn(!screenShareOn)}
            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${screenShareOn ? 'bg-blue-600 shadow-blue-500/40 shadow-xl scale-110' : 'bg-[#3c4043] hover:bg-white/10 text-gray-400'}`}
          >
            <MonitorUp className="w-6 h-6" strokeWidth={1.5} />
          </button>

          <button
            onClick={props.onLeave}
            className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-3 ml-4"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden sm:inline">Terminate Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const UserVolumeIndicator = ({ track, micOn }: { track: any, micOn: boolean }) => {
  return (
    <>
      <VolumeBar track={track} isActive={micOn} />
      <SpeakingAura track={track} isActive={micOn} />
    </>
  );
};

export default StudyRooms;
