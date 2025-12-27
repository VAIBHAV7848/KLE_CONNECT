import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Map, MapPin, Building2, Globe, Navigation } from 'lucide-react';
import pointsData from '@/data/campus_points.json';

// ... (retain CampusCanvasMap if it's there, or we can just ignore it since we aren't using it in the main component anymore, but I'll stick to editing the main component)

const CampusMap = () => {
  const [viewMode, setViewMode] = useState<'map' | 'street'>('map');

  const locations = [
    { name: 'Main Library', type: 'Library', floor: 'Ground Floor', color: 'hsl(199 89% 48%)' },
    { name: 'Computer Lab A', type: 'Lab', floor: 'Main Block', color: 'hsl(142 76% 36%)' },
    { name: 'Auditorium', type: 'Venue', floor: 'Mechanical Block', color: 'hsl(263 70% 58%)' },
    { name: 'Cafeteria', type: 'Food', floor: 'Near Garden', color: 'hsl(45 93% 47%)' },
    { name: 'Sports Complex', type: 'Sports', floor: 'Outdoor', color: 'hsl(330 80% 55%)' },
    { name: 'Admin Block', type: 'Office', floor: 'Main Entrance', color: 'hsl(15 90% 55%)' },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Map}
        title="Campus Map"
        subtitle="Locate your way around KLE Tech, Belagavi"
        gradient="linear-gradient(135deg, hsl(15 90% 55% / 0.3), hsl(15 90% 55% / 0.1))"
      />

      {/* Map Container */}
      <motion.div
        layout
        className="glass rounded-2xl p-2 mb-6 relative overflow-hidden h-[500px] flex items-center justify-center border border-white/10 shadow-2xl group"
      >
        <AnimatePresence mode="wait">
          {viewMode === 'map' ? (
            <motion.iframe
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3838.328374828131!2d74.48425267592984!3d15.83935278480749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbf668f6eb689e1%3A0xe74e7604a56c459e!2sKLE%20Dr.%20M.%20S.%20Sheshgiri%20College%20of%20Engineering%20and%20Technology!5e0!3m2!1sen!2sin!4v1703672000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full grayscale-[0.3] hover:grayscale-0 transition-all duration-500"
            />
          ) : (
            <motion.iframe
              key="street"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src="https://www.google.com/maps/embed?pb=!4v1766862401947!6m8!1m7!1sCAoSFkNJSE0wb2dLRUlDQWdJRDRpLXktWEE.!2m2!1d15.82035380132274!2d74.4985191981654!3f40!4f0!5f0.7820865974627469"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          )}
        </AnimatePresence>

        {/* View Toggle Control */}
        {/* View Toggle Control */}
        <div className="absolute bottom-4 right-4 z-10">
          <motion.button
            onClick={() => setViewMode(prev => prev === 'map' ? 'street' : 'map')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl font-bold shadow-xl transition-all border ${viewMode === 'map'
                ? 'bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-300'
                : 'bg-white text-black border-white hover:bg-gray-100'
              }`}
          >
            {viewMode === 'map' ? (
              <>
                <div className="bg-black/10 p-1.5 rounded-full">
                  <Navigation className="w-5 h-5 fill-current" />
                </div>
                <span className="font-display text-sm tracking-wide">Enter Street View</span>
              </>
            ) : (
              <>
                <div className="bg-black/10 p-1.5 rounded-full">
                  <Map className="w-5 h-5" />
                </div>
                <span className="font-display text-sm tracking-wide">Return to Map</span>
              </>
            )}
          </motion.button>
        </div>
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
