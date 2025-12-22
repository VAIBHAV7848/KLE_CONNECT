import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { GraduationCap, Users, Clock, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Study Rooms - Virtual study sessions with peers
 */
const StudyRooms = () => {
  const activeRooms = [
    { 
      name: 'DSA Problem Solving', 
      host: 'Rahul M.', 
      participants: 12, 
      topic: 'Graph Algorithms',
      live: true 
    },
    { 
      name: 'DBMS Revision', 
      host: 'Priya S.', 
      participants: 8, 
      topic: 'Normalization',
      live: true 
    },
    { 
      name: 'ML Study Group', 
      host: 'Arun K.', 
      participants: 15, 
      topic: 'Neural Networks',
      live: true 
    },
  ];

  const scheduledRooms = [
    { name: 'OS Concepts Deep Dive', host: 'Sneha R.', time: '4:00 PM', participants: 6 },
    { name: 'Competitive Programming', host: 'Vikram J.', time: '6:00 PM', participants: 10 },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={GraduationCap}
        title="Study Rooms"
        subtitle="Join virtual study sessions with your peers"
        gradient="linear-gradient(135deg, hsl(330 80% 55% / 0.3), hsl(330 80% 55% / 0.1))"
      />

      {/* Live Rooms */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground font-display">
          Live Now
          <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" />
        </h2>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Video className="w-4 h-4" />
          Create Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {activeRooms.map((room, index) => (
          <motion.div
            key={room.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass rounded-2xl p-5 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-red-400 font-medium">LIVE</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{room.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{room.topic}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{room.participants} studying</span>
              </div>
              <Button size="sm" variant="outline">Join</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Hosted by {room.host}</p>
          </motion.div>
        ))}
      </div>

      {/* Scheduled Rooms */}
      <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Scheduled Today</h2>
      <div className="space-y-3">
        {scheduledRooms.map((room, index) => (
          <motion.div
            key={room.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            className="glass rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-foreground font-medium">{room.name}</h3>
                <p className="text-sm text-muted-foreground">By {room.host} • {room.participants} interested</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-primary font-medium">{room.time}</span>
              <Button size="sm" variant="outline">Remind Me</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default StudyRooms;
