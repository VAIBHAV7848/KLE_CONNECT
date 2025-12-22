import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { MessageCircle, ThumbsUp, Send, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

/**
 * Doubts - Q&A forum for academic discussions
 */
const Doubts = () => {
  const [newQuestion, setNewQuestion] = useState('');
  
  const questions = [
    {
      id: 1,
      question: 'How do I implement a min-heap from scratch in Python?',
      author: 'Rahul M.',
      subject: 'Data Structures',
      answers: 5,
      votes: 12,
      time: '2 hours ago'
    },
    {
      id: 2,
      question: 'Can someone explain the difference between mutex and semaphore?',
      author: 'Priya S.',
      subject: 'Operating Systems',
      answers: 8,
      votes: 24,
      time: '5 hours ago'
    },
    {
      id: 3,
      question: 'Best approach for normalizing a database with complex relationships?',
      author: 'Arun K.',
      subject: 'Database Systems',
      answers: 3,
      votes: 8,
      time: 'Yesterday'
    },
  ];

  const tags = ['Data Structures', 'Algorithms', 'OS', 'DBMS', 'Networks', 'ML'];

  return (
    <PageLayout>
      <PageHeader
        icon={MessageCircle}
        title="Doubts"
        subtitle="Ask questions and help your peers"
        gradient="linear-gradient(135deg, hsl(180 70% 45% / 0.3), hsl(180 70% 45% / 0.1))"
      />

      {/* Ask Question */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-6 mb-6"
      >
        <h3 className="text-lg font-semibold text-foreground mb-3">Ask a Question</h3>
        <Textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="What's your doubt? Be specific for better answers..."
          className="bg-muted border-border mb-3"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 4).map((tag) => (
              <button
                key={tag}
                className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Send className="w-4 h-4" />
            Post Question
          </Button>
        </div>
      </motion.div>

      {/* Questions List */}
      <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Recent Questions</h2>
      <div className="space-y-4">
        {questions.map((q, index) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
            className="glass rounded-xl p-5 cursor-pointer hover:scale-[1.01] transition-transform"
          >
            <div className="flex gap-4">
              {/* Votes */}
              <div className="flex flex-col items-center gap-1">
                <button className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
                  <ThumbsUp className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </button>
                <span className="text-sm font-medium text-foreground">{q.votes}</span>
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="text-foreground font-medium mb-2 hover:text-primary transition-colors">
                  {q.question}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {q.subject}
                  </span>
                  <span>•</span>
                  <span>{q.answers} answers</span>
                  <span>•</span>
                  <span>{q.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Asked by {q.author}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default Doubts;
