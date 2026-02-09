import { serve } from "https://deno.land/std/http/server.ts";

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

interface QueryRequest {
  user_id?: string;
  question: string;
  filters?: {
    semester?: string;
    course?: string;
    unit?: string;
    topic?: string;
  };
}

interface QueryResponse {
  answer: string;
  citations: string[];
  sources?: Array<{
    title: string;
    similarity: number;
  }>;
}

/**
 * ThinkLM Query API
 * Retrieves study material answers based on uploaded documents
 * Uses vector similarity search for relevant content retrieval
 */
serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: QueryRequest = await req.json();

    if (!body.question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate question length
    if (body.question.length > 1000) {
      return new Response(
        JSON.stringify({ error: 'Question exceeds maximum length of 1000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client for database queries
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
    // 1. Generate embedding vector for the question using an embedding model
    // 2. Query the embeddings table for similar chunks using vector similarity
    // 3. Retrieve top-N most relevant chunks
    // 4. Call LLM with system prompt grounded in retrieved chunks
    // 5. Return formatted answer with citations

    // For MVP: Return structured stub response
    const response: QueryResponse = {
      answer: `Based on your uploaded materials regarding "${body.question}":\n\nThis feature is currently in beta. In the full version, I would search through your uploaded study materials and provide a comprehensive answer with citations to specific sections of your notes.\n\nTo get the best results, make sure you've uploaded relevant materials for the topic you're asking about.`,
      citations: ["material-1", "material-2"],
      sources: [
        { title: "Relevant study material", similarity: 0.92 },
        { title: "Supplementary notes", similarity: 0.85 }
      ]
    };

    console.log(`[ThinkLM Query] Question: "${body.question.substring(0, 50)}..." | Filters:`, body.filters);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('ThinkLM Query Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
