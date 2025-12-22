import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { BookOpen, Download, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Notes & PYQs - Study materials and past papers
 */
const Notes = () => {
  const subjects = [
    { name: 'Data Structures', notes: 12, pyqs: 5, color: 'hsl(199 89% 48%)' },
    { name: 'Operating Systems', notes: 8, pyqs: 4, color: 'hsl(142 76% 36%)' },
    { name: 'Computer Networks', notes: 10, pyqs: 6, color: 'hsl(263 70% 58%)' },
    { name: 'Database Systems', notes: 9, pyqs: 4, color: 'hsl(45 93% 47%)' },
    { name: 'Software Engineering', notes: 7, pyqs: 3, color: 'hsl(330 80% 55%)' },
    { name: 'Machine Learning', notes: 11, pyqs: 4, color: 'hsl(15 90% 55%)' },
  ];

  const recentNotes = [
    { title: 'Binary Trees Complete Guide', subject: 'Data Structures', rating: 4.8, downloads: 234 },
    { title: 'Process Scheduling Algorithms', subject: 'Operating Systems', rating: 4.6, downloads: 189 },
    { title: 'TCP/IP Protocol Stack', subject: 'Computer Networks', rating: 4.9, downloads: 312 },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={BookOpen}
        title="Notes & PYQs"
        subtitle="Curated study materials and past year questions"
        gradient="linear-gradient(135deg, hsl(142 76% 36% / 0.3), hsl(142 76% 36% / 0.1))"
      />

      {/* Subjects Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="glass rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
          >
            <div 
              className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
              style={{ background: `${subject.color}33` }}
            >
              <FileText className="w-5 h-5" style={{ color: subject.color }} />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-2">{subject.name}</h3>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{subject.notes} notes</span>
              <span>•</span>
              <span>{subject.pyqs} PYQs</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Notes */}
      <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Popular Notes</h2>
      <div className="space-y-3">
        {recentNotes.map((note, index) => (
          <motion.div
            key={note.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            className="glass rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-foreground font-medium">{note.title}</h3>
                <p className="text-sm text-muted-foreground">{note.subject}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-foreground">{note.rating}</span>
              </div>
              <span className="text-xs text-muted-foreground">{note.downloads} downloads</span>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default Notes;
