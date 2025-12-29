import { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/ui/PageHeader';
import { UploadCloud, FileText, Brain, FolderTree, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ThinkLM = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState('Pick a file to auto-ingest.');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string>('');
  const [loadingAnswer, setLoadingAnswer] = useState(false);

  const ingestUrl = (import.meta.env.VITE_THINKLM_INGEST_URL || '').trim();
  const queryUrl = (import.meta.env.VITE_THINKLM_QUERY_URL || '').trim();
  const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const ingestConfigured = Boolean(ingestUrl);

  const deriveTitle = (f: File | null) => {
    if (!f) return 'Untitled';
    const name = f.name || 'Untitled';
    return name.replace(/\.[^/.]+$/, '') || name;
  };

  const uploadAndIngest = async (selectedFile: File) => {
    if (!ingestConfigured) {
      setUploadNote('Ingest URL not configured. Set VITE_THINKLM_INGEST_URL.');
      return;
    }
    setUploading(true);
    setUploadNote('Ingesting...');

    try {
      // MVP stub: In a real app, upload file to Supabase Storage and pass storage_path to ingest function
      const storage_path = `materials/demo/${selectedFile.name}`;
      const title = deriveTitle(selectedFile);

      const payload = {
        user_id: 'demo-user',
        subject: { semester: '', course: '', unit: '', topic: '' },
        material: { title, file_type: selectedFile.type || 'application/octet-stream', storage_path }
      };

      const res = await fetch(ingestUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Ingest failed: ${res.status}`);

      // Cache minimal payload offline
      const cache = JSON.parse(localStorage.getItem('thinklm-materials') || '[]');
      cache.unshift({ ...payload, created_at: Date.now() });
      localStorage.setItem('thinklm-materials', JSON.stringify(cache));
      setUploadNote(`Ingested: ${selectedFile.name}`);
    } catch (e: any) {
      setUploadNote(`Ingest error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (!f) return;
    if (!ingestConfigured) {
      setUploadNote('Ingest URL not configured. Set VITE_THINKLM_INGEST_URL.');
      return;
    }
    uploadAndIngest(f);
  };

  const askGrounded = async () => {
    if (!question) return;
    setLoadingAnswer(true);
    try {
      if (!queryUrl) throw new Error('Query URL not configured (VITE_THINKLM_QUERY_URL).');
      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({ user_id: 'demo-user', question, filters: {} })
      });
      if (!res.ok) throw new Error(`Query failed: ${res.status}`);
      const data = await res.json();
      setAnswer(`${data.answer}\n\nCitations: ${data.citations?.join(', ') || 'N/A'}`);

      // Cache Q&A offline
      const qa = JSON.parse(localStorage.getItem('thinklm-qa') || '[]');
      qa.unshift({ question, answer: data.answer, citations: data.citations, when: Date.now() });
      localStorage.setItem('thinklm-qa', JSON.stringify(qa));
    } catch (e: any) {
      setAnswer(`Error: ${e.message}`);
    } finally {
      setLoadingAnswer(false);
    }
  };

  return (
    <PageLayout>
      <div className="p-6">
        <PageHeader icon={Brain} title="ThinkLM" subtitle="Grounded AI over your notes" gradient="linear-gradient(135deg, hsl(199 89% 48% / 0.3), hsl(263 70% 58% / 0.1))" />

        {/* Uploads */}
        <div className="glass rounded-2xl p-4 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <UploadCloud className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">Upload PDF/notes/images (auto-ingests)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <input type="file" accept=".pdf,image/*,.txt" onChange={handleFileChange} />
            <div className="text-xs text-muted-foreground">
              {uploading ? (
                <span className="inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Ingesting...</span>
              ) : (
                uploadNote
              )}
            </div>
          </div>
          {file && (
            <div className="mt-3 text-xs text-muted-foreground">Selected: {file.name}</div>
          )}
        </div>

        {/* Grounded Q&A */}
        <div className="glass rounded-2xl p-4 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">Grounded Q&A</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask based on your uploaded material..." />
            <Button disabled={!question || loadingAnswer} onClick={askGrounded}>
              {loadingAnswer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />} Ask
            </Button>
          </div>
          {answer && (
            <div className="mt-4 p-3 rounded-xl bg-muted/50 border text-sm whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </div>

        {/* Offline cache badge */}
        <div className="mt-6 text-xs text-muted-foreground">
          Offline cache: {JSON.parse(localStorage.getItem('thinklm-materials') || '[]').length} materials, {JSON.parse(localStorage.getItem('thinklm-qa') || '[]').length} Q&A items
        </div>
      </div>
    </PageLayout>
  );
};

export default ThinkLM;
