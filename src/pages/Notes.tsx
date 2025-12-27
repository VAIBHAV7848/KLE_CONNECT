import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { BookOpen, Download, FileText, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Notes & PYQs - Study materials and past papers
 */
const Notes = () => {
  // State
  const [notes, setNotes] = useState<{ id: string, title: string, subject: string, link: string, rating: number, downloads: number }[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', subject: '', link: '' });

  // Load Notes
  useEffect(() => {
    const saved = localStorage.getItem('kle-connect-notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    } else {
      // Default Seed Data
      setNotes([]);
    }
  }, []);

  // Save Notes
  useEffect(() => {
    localStorage.setItem('kle-connect-notes', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    if (!newNote.title || !newNote.subject) return;
    const note = {
      id: crypto.randomUUID(),
      title: newNote.title,
      subject: newNote.subject,
      link: newNote.link || '#',
      rating: 5.0,
      downloads: 0
    };
    setNotes([note, ...notes]);
    setNewNote({ title: '', subject: '', link: '' });
    setIsUploadOpen(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  // Dynamically calculate subjects from real data
  const uniqueSubjects = Array.from(new Set(notes.map(n => n.subject)));
  const dynamicSubjects = uniqueSubjects.map(sub => ({
    name: sub,
    notes: notes.filter(n => n.subject === sub).length,
    color: `hsl(${Math.random() * 360} 70% 50%)`
  }));

  // Default suggested subjects
  const suggestions = ['Data Structures', 'Operating Systems', 'Computer Networks', 'Database Systems', 'Machine Learning'];

  return (
    <PageLayout>
      <PageHeader
        icon={BookOpen}
        title="Notes & PYQs"
        subtitle="Manage and share your study resources"
        gradient="linear-gradient(135deg, hsl(142 76% 36% / 0.3), hsl(142 76% 36% / 0.1))"
      />

      {/* Subjects Grid */}
      {/* Dynamic Subjects Grid */}
      {dynamicSubjects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {dynamicSubjects.map((subject, index) => (
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
                <span>{subject.notes} items</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Notes */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground font-display">Shared Resources</h2>
        <Button onClick={() => setIsUploadOpen(!isUploadOpen)} className="gap-2">
          <Download className="w-4 h-4 rotate-180" /> Upload Resource
        </Button>
      </div>

      {/* Upload Form */}
      {isUploadOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass p-6 rounded-xl mb-6 border border-primary/20"
        >
          <h3 className="font-semibold mb-4">Add New Material</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="p-3 bg-muted/50 rounded-lg border border-transparent focus:border-primary outline-none"
              placeholder="Title (e.g. Unit 1 Notes)"
              value={newNote.title}
              onChange={e => setNewNote({ ...newNote, title: e.target.value })}
            />
            <div className="relative">
              <input
                className="w-full p-3 bg-muted/50 rounded-lg border border-transparent focus:border-primary outline-none"
                placeholder="Subject (e.g. AI)"
                value={newNote.subject}
                onChange={e => setNewNote({ ...newNote, subject: e.target.value })}
              />
              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setNewNote(prev => ({ ...prev, subject: s }))}
                    className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <input
              className="p-3 bg-muted/50 rounded-lg border border-transparent focus:border-primary outline-none"
              placeholder="Link (Google Drive / URL)"
              value={newNote.link}
              onChange={e => setNewNote({ ...newNote, link: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!newNote.title || !newNote.subject}>Share Resource</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {notes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No notes shared yet. Key start the knowledge exchange! 🚀</p>
          </div>
        )}

        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass rounded-xl p-4 flex items-center justify-between group"
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
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <a href={note.link} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4" /> Open
                </a>
              </Button>
              <button
                onClick={() => deleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity px-2"
              >✕</button>
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default Notes;
