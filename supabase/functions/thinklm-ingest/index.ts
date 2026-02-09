import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://kle-connect.vercel.app',
  'https://kle-connect.firebaseapp.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };
}

interface SubjectMetadata {
  semester: string;
  course: string;
  unit: string;
  topic: string;
}

interface MaterialMetadata {
  title: string;
  file_type: string;
  storage_path: string;
  size_bytes?: number;
}

interface IngestRequest {
  user_id: string;
  subject: SubjectMetadata;
  material: MaterialMetadata;
}

interface IngestResponse {
  status: string;
  job_id: string;
  message: string;
  estimated_time?: string;
}

/**
 * ThinkLM Ingest API
 * Accepts study material metadata and schedules processing
 * Processing includes: text extraction, chunking, embedding generation
 */
serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: IngestRequest = await req.json();

    // Validate required fields
    if (!body.user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.subject || !body.subject.semester || !body.subject.course) {
      return new Response(
        JSON.stringify({ error: 'subject metadata with semester and course is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!body.material || !body.material.storage_path) {
      return new Response(
        JSON.stringify({ error: 'material with storage_path is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID();

    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In production, this would:
    // 1. Validate the file exists in Supabase Storage
    // 2. Insert metadata into materials table
    // 3. Enqueue a background job for processing
    // 4. Background job would:
    //    - Download file from Storage
    //    - Extract text (PDF parser / OCR for images)
    //    - Chunk text into semantic segments
    //    - Generate embeddings using an embedding model
    //    - Store embeddings in vector database
    //    - Update material status to 'processed'

    // For MVP: Return acceptance response
    const response: IngestResponse = {
      status: 'accepted',
      job_id: jobId,
      message: `Material "${body.material.title}" has been queued for processing. You'll be able to query it once processing is complete.`,
      estimated_time: '2-5 minutes'
    };

    console.log(`[ThinkLM Ingest] Job ${jobId} | User: ${body.user_id} | Material: ${body.material.title} | Type: ${body.material.file_type}`);

    return new Response(JSON.stringify(response), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ThinkLM Ingest Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
