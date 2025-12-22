import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Heart, Gift, HandHeart, BookHeart } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Student Help - Support and resources for students in need
 */
const StudentHelp = () => {
  const helpCategories = [
    {
      icon: BookHeart,
      title: 'Book Exchange',
      description: 'Donate or borrow textbooks and study materials',
      items: 45,
      color: 'hsl(199 89% 48%)'
    },
    {
      icon: Gift,
      title: 'Essentials Drive',
      description: 'Access stationary, clothing, and daily essentials',
      items: 120,
      color: 'hsl(142 76% 36%)'
    },
    {
      icon: HandHeart,
      title: 'Financial Aid',
      description: 'Scholarships and emergency fund information',
      items: 15,
      color: 'hsl(263 70% 58%)'
    },
  ];

  const recentDonations = [
    { item: 'Engineering Mathematics Textbook', donor: 'Anonymous', time: '2 hours ago' },
    { item: 'Scientific Calculator', donor: 'Priya S.', time: '5 hours ago' },
    { item: 'Laptop Bag', donor: 'Alumni Association', time: 'Yesterday' },
  ];

  return (
    <PageLayout>
      <PageHeader
        icon={Heart}
        title="Student Help"
        subtitle="Supporting each other through college life"
        gradient="linear-gradient(135deg, hsl(350 80% 50% / 0.3), hsl(350 80% 50% / 0.1))"
      />

      {/* Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {helpCategories.map((category, index) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass rounded-2xl p-6 hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <div 
              className="w-14 h-14 rounded-xl mb-4 flex items-center justify-center"
              style={{ background: `${category.color}33` }}
            >
              <category.icon className="w-7 h-7" style={{ color: category.color }} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{category.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
            <p className="text-sm text-primary font-medium">{category.items} items available</p>
          </motion.div>
        ))}
      </div>

      {/* Donate CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass rounded-2xl p-6 mb-6 text-center relative overflow-hidden"
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{ background: 'linear-gradient(135deg, hsl(350 80% 50%), hsl(263 70% 58%))' }}
        />
        <div className="relative z-10">
          <Heart className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2 font-display">
            Make a Difference
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Your donation can help a fellow student succeed. Every contribution matters.
          </p>
          <Button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Donate Now
          </Button>
        </div>
      </motion.div>

      {/* Recent Donations */}
      <h2 className="text-xl font-semibold text-foreground mb-4 font-display">Recent Donations</h2>
      <div className="space-y-3">
        {recentDonations.map((donation, index) => (
          <motion.div
            key={donation.item}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            className="glass rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h3 className="text-foreground font-medium">{donation.item}</h3>
                <p className="text-sm text-muted-foreground">By {donation.donor}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{donation.time}</span>
          </motion.div>
        ))}
      </div>
    </PageLayout>
  );
};

export default StudentHelp;
