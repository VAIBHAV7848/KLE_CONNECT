import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Map, MapPin, Building2 } from 'lucide-react';
import pointsData from '@/data/campus_points.json';

const CampusCanvasMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvas) return;
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let i = 0; i < height; i += 20) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
      }

      // Draw points
      // Center the map: (0,0) in data should be center of canvas
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = 5; // Zoom factor

      pointsData.forEach(p => {
        const screenX = centerX + (p.x * scale);
        const screenY = centerY + (p.z * scale); // Mapping Z to Y for top-down

        ctx.beginPath();
        ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.c || '#fff';
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.c || '#fff';
      });
      ctx.shadowBlur = 0;
    };

    // Handle resize
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        draw();
      }
    };

    window.addEventListener('resize', resize);
    resize(); // Initial draw

    // Optional: Simple animation loop if we want pulsing or movement
    let animationId: number;
    const animate = () => {
      // Redraw if needed for animation
      // For now, static draw is fine, just re-draw on resize
    };

    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

/**
 * Campus Map - Interactive campus navigation
 */
const CampusMap = () => {
  const locations = [
    { name: 'Main Library', type: 'Library', floor: 'Ground Floor', color: 'hsl(199 89% 48%)' },
    { name: 'Computer Lab A', type: 'Lab', floor: '2nd Floor', color: 'hsl(142 76% 36%)' },
    { name: 'Auditorium', type: 'Venue', floor: 'Ground Floor', color: 'hsl(263 70% 58%)' },
    { name: 'Cafeteria', type: 'Food', floor: 'Ground Floor', color: 'hsl(45 93% 47%)' },
    { name: 'Sports Complex', type: 'Sports', floor: 'Outdoor', color: 'hsl(330 80% 55%)' },
    { name: 'Admin Block', type: 'Office', floor: '1st Floor', color: 'hsl(15 90% 55%)' },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Map}
        title="Campus Map"
        subtitle="Navigate your campus with ease"
        gradient="linear-gradient(135deg, hsl(15 90% 55% / 0.3), hsl(15 90% 55% / 0.1))"
      />

      {/* 2D Interactive Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-4 mb-6 relative overflow-hidden h-[500px] flex items-center justify-center border border-white/10"
      >
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <h3 className="text-xl font-bold text-white mb-1">Campus Radar</h3>
          <p className="text-sm text-gray-300">Top-down Digital Twin View</p>
        </div>

        <CampusCanvasMap />
      </motion.div>

      {/* Quick Locations */}
      <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Quick Locations</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {locations.map((location, index) => (
          <motion.div
            key={location.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform"
          >
            <div
              className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center"
              style={{ background: `${location.color}33` }}
            >
              <Building2 className="w-5 h-5" style={{ color: location.color }} />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">{location.name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{location.floor}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default CampusMap;
