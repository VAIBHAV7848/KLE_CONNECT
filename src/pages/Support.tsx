import { useState } from 'react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HeartHandshake, Coffee, ArrowUpRight, QrCode, Github, Linkedin, Instagram, HandCoins, X } from 'lucide-react';

interface QrCodeOption {
  label: string;
  note: string;
  imageHint: string;
}

interface TeamMate {
  name: string;
  role: string;
  image: string;
  github: string;
  linkedin: string;
  instagram: string;
  accent: string;
}

// Use the configured Vite base; fallback to the known deployed path
const appBase = '/KLE_CONNECT/';
const baseUrl = (import.meta as any)?.env?.BASE_URL || appBase;
const qrImageUrl = new URL('paytm-om-ganesh.png', `${window.location.origin}${baseUrl}`).toString();

const qrCodes: QrCodeOption[] = [
  {
    label: 'Buy Me a Coffee',
    note: 'Scan and pay any amount you are comfortable with.',
    imageHint: qrImageUrl
  }
];

const upiLink = 'upi://pay?pa=omganeshmatiwade007@pingpay&pn=elitehacker&tn=Support%20the%20Creator';

const teammates: TeamMate[] = [
  {
    name: 'Omganesh Matiwade',
    role: 'Full Stack Developer',
    image: '/team-1.jpg',
    github: 'https://github.com/omganesh',
    linkedin: 'https://www.linkedin.com/in/omganesh-matiwade',
    instagram: 'https://www.instagram.com/omganesh',
    accent: 'hsl(199 89% 48%)'
  },
  {
    name: 'Vaibhav Chavanpatil',
    role: 'Backend Developer',
    image: '/team-2.jpg',
    github: 'https://github.com/vaibhavchavanpatil',
    linkedin: 'https://www.linkedin.com/in/vaibhav-chavanpatil',
    instagram: 'https://www.instagram.com/vaibhav_chavanpatil',
    accent: 'hsl(263 70% 58%)'
  },
  {
    name: 'Darshan Kittur',
    role: 'UI/UX Designer',
    image: '/team-3.jpg',
    github: 'https://github.com/darshankittur',
    linkedin: 'https://www.linkedin.com/in/darshan-kittur',
    instagram: 'https://www.instagram.com/darshan.kittur',
    accent: 'hsl(35 90% 55%)'
  }
];

const getInitials = (name: string) => name.split(' ').map(part => part[0] || '').join('').slice(0, 2).toUpperCase();

const TeamAvatar = ({ name, src, accent }: { name: string; src: string; accent: string }) => {
  const [failed, setFailed] = useState(false);
  const initials = getInitials(name);

  if (failed || !src) {
    return (
      <div
        className="w-24 h-24 rounded-full border border-border/60 flex items-center justify-center text-lg font-semibold"
        style={{ background: `${accent}26` }}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className="w-24 h-24 rounded-full overflow-hidden border border-border/60 bg-muted/60">
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
        loading="lazy"
      />
    </div>
  );
};

const QrImage = ({ src, alt }: { src: string; alt: string }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/40 flex items-center justify-center w-64 h-64 px-4 text-center text-xs text-muted-foreground">
        Could not load {src}. Place your QR file at that exact path inside /public.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 flex items-center justify-center w-64 h-64 overflow-hidden p-2">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
};

const buyMeACoffeeLink = 'https://buymeacoffee.com/yourname';
const paytmLink = 'https://paytm.me/yourlink';

const Support = () => {
  const [qrModalOpen, setQrModalOpen] = useState(false);

  return (
    <PageLayout>
      <PageHeader
        icon={HeartHandshake}
        title="Meet the Developers"
        subtitle="Built with passion. Supported by the community."
        gradient="linear-gradient(135deg, hsl(199 89% 48% / 0.25), hsl(45 93% 47% / 0.15))"
      />

      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass rounded-2xl p-6 flex flex-col gap-3"
        >
          <p className="text-sm text-muted-foreground">
            Meet the developers behind the project and support the work if you found it useful.
          </p>
          <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <HandCoins className="w-4 h-4 text-primary mt-0.5" />
              <span>Direct, optional support - no feature gating or subscriptions.</span>
            </div>
            <div className="flex items-start gap-2">
              <Coffee className="w-4 h-4 text-primary mt-0.5" />
              <span>Micro-payments add up over time and keep the project healthy.</span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary mt-0.5" />
              <span>Messages often include appreciation, bug reports, and feature ideas.</span>
            </div>
          </div>
        </motion.div>

        <section className="grid gap-4 md:grid-cols-3">
          {teammates.map((mate, index) => (
            <motion.div
              key={mate.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="glass rounded-2xl p-5 border border-border/50"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <TeamAvatar name={mate.name} src={mate.image} accent={mate.accent} />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{mate.name}</h3>
                  <p className="text-sm text-muted-foreground">{mate.role}</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  <Button asChild size="sm" variant="outline">
                    <a href={mate.github} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                      <Github className="w-4 h-4" /> GitHub
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={mate.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={mate.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-6 border border-border/50"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">Support Our Work</h3>
              <p className="text-sm text-muted-foreground max-w-2xl">
                If this project helped you, consider supporting us. Your contribution helps us maintain, improve, and scale.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setQrModalOpen(true)}>
                <Coffee className="w-4 h-4" /> Support via Buy Me a Coffee
              </Button>
              <Button variant="outline" onClick={() => window.location.assign(upiLink)}>
                <QrCode className="w-4 h-4" /> Pay via UPI
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Every contribution means a lot.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass rounded-2xl p-6 grid gap-4 md:grid-cols-3 border border-border/40"
        >
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Support flow</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              1) Open the Buy Me a Coffee link  2) Choose an amount  3) Pay (card / UPI / PayPal)  4) Optionally leave a message  5) Money goes directly to you.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Why it helps</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Direct income without ads or contracts. Great for open-source, free tools, tutorials, and hackathon projects.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Best practices</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Keep it optional and respectful. Mention where funds go. Add this link to your footer, README, and portfolio.
            </p>
          </div>
        </motion.div>
      </div>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Support via QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center text-center gap-4 py-4">
            {qrCodes.map((qr) => (
              <div key={qr.label} className="flex flex-col items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-foreground">{qr.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{qr.note}</p>
                </div>
                <QrImage src={qr.imageHint} alt={`${qr.label} QR`} />
                <p className="text-[11px] text-muted-foreground">
                  Place your QR file at {qr.imageHint} inside /public.
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Support;
