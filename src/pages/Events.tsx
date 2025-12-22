import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Events - Campus events and activities
 */
const Events = () => {
  const upcomingEvents = [
    {
      title: 'Tech Fest 2024',
      date: 'Dec 28, 2024',
      time: '9:00 AM',
      venue: 'Main Auditorium',
      attendees: 350,
      type: 'Technical',
      color: 'hsl(199 89% 48%)'
    },
    {
      title: 'Hackathon: Code Sprint',
      date: 'Jan 5, 2025',
      time: '10:00 AM',
      venue: 'Computer Lab A',
      attendees: 120,
      type: 'Competition',
      color: 'hsl(263 70% 58%)'
    },
    {
      title: 'Industry Expert Talk',
      date: 'Jan 10, 2025',
      time: '2:00 PM',
      venue: 'Seminar Hall',
      attendees: 80,
      type: 'Seminar',
      color: 'hsl(142 76% 36%)'
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Calendar}
        title="Events"
        subtitle="Stay updated with campus happenings"
        gradient="linear-gradient(135deg, hsl(280 70% 50% / 0.3), hsl(280 70% 50% / 0.1))"
      />

      {/* Featured Event */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-6 mb-6 relative overflow-hidden"
      >
        <div 
          className="absolute inset-0 opacity-20"
          style={{ background: 'linear-gradient(135deg, hsl(199 89% 48%), hsl(263 70% 58%))' }}
        />
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full mb-4">
            Featured Event
          </span>
          <h2 className="text-2xl font-bold text-foreground mb-2 font-display">Tech Fest 2024</h2>
          <p className="text-muted-foreground mb-4 max-w-xl">
            The biggest technical festival of KLE featuring workshops, competitions, and networking opportunities.
          </p>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Dec 28, 2024</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>9:00 AM - 6:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>Main Auditorium</span>
            </div>
          </div>
          <Button className="bg-primary hover:bg-primary/90">Register Now</Button>
        </div>
      </motion.div>

      {/* Upcoming Events */}
      <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Upcoming Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {upcomingEvents.map((event, index) => (
          <motion.div
            key={event.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <span 
              className="inline-block px-2 py-1 text-xs font-medium rounded-full mb-3"
              style={{ background: `${event.color}33`, color: event.color }}
            >
              {event.type}
            </span>
            <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>
            <div className="space-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{event.attendees} attending</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">Interested</Button>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default Events;
