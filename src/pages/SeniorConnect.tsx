import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Users, MessageSquare, Star, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Senior Connect - Connect with seniors for guidance
 */
const SeniorConnect = () => {
  const seniors = [
    {
      name: 'Aditya Sharma',
      year: '4th Year',
      branch: 'Computer Science',
      company: 'Google',
      skills: ['DSA', 'System Design', 'CP'],
      rating: 4.9,
      sessions: 45
    },
    {
      name: 'Neha Patel',
      year: '4th Year',
      branch: 'Information Science',
      company: 'Microsoft',
      skills: ['ML', 'Python', 'Research'],
      rating: 4.8,
      sessions: 32
    },
    {
      name: 'Rohan Kumar',
      year: 'Alumni',
      branch: 'Computer Science',
      company: 'Amazon',
      skills: ['Backend', 'AWS', 'Interviews'],
      rating: 5.0,
      sessions: 78
    },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Users}
        title="Senior Connect"
        subtitle="Get guidance from experienced seniors and alumni"
        gradient="linear-gradient(135deg, hsl(220 70% 55% / 0.3), hsl(220 70% 55% / 0.1))"
      />

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        {[
          { label: 'Active Mentors', value: '50+' },
          { label: 'Sessions Completed', value: '500+' },
          { label: 'Students Helped', value: '1000+' },
        ].map((stat, index) => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary font-display">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Mentors */}
      <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Top Mentors</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seniors.map((senior, index) => (
          <motion.div
            key={senior.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            className="glass rounded-2xl p-5"
          >
            {/* Avatar placeholder */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl font-bold text-foreground">
                {senior.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{senior.name}</h3>
                <p className="text-sm text-muted-foreground">{senior.year} • {senior.branch}</p>
              </div>
            </div>
            
            {/* Company */}
            <div className="flex items-center gap-2 mb-3 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{senior.company}</span>
            </div>
            
            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {senior.skills.map((skill) => (
                <span 
                  key={skill}
                  className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-foreground">{senior.rating}</span>
              </div>
              <span className="text-muted-foreground">{senior.sessions} sessions</span>
            </div>
            
            <Button variant="outline" className="w-full gap-2">
              <MessageSquare className="w-4 h-4" />
              Connect
            </Button>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default SeniorConnect;
