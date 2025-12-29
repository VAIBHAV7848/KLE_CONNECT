import { serve } from "https://deno.land/std/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

/*
Query API (MVP)
- Accepts a question and subject filters.
- Retrieves top-N chunks by similarity (requires precomputed embeddings),
- Responds with a grounded answer stub and cites chunk IDs.

Expected JSON body:
{
  "user_id": "...",
  "question": "Explain AVL rotations",
  "filters": { "semester": "S5", "course": "DSA", "unit": "Unit 2", "topic": "Trees" }
}
*/

serve(async (req: { method: string; json: () => any; }) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // TODO: Embed query vector via your embedding service
    // TODO: SELECT top chunks from embeddings table (cosine / inner product), join chunks for text
    // TODO: Call LLM with system prompt to answer ONLY using provided chunks; include citations

    const stub = {
      answer: "AVL rotations involve rebalancing via single or double rotations (LL, RR, LR, RL). This explanation is grounded to your uploaded DSA notes.",
      citations: ["chunk-1", "chunk-9"],
    };

    return new Response(JSON.stringify(stub), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


