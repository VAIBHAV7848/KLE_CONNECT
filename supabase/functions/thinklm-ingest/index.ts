import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

/*
Ingest API (MVP)
- Accepts metadata for an uploaded file stored in Supabase Storage.
- Schedules extraction (PDF/text/image OCR), chunking, embedding creation.
- For MVP, returns 202 Accepted and echoes the payload.

Expected JSON body:
{
  "user_id": "...",
  "subject": { "semester": "S5", "course": "DSA", "unit": "Unit 2", "topic": "Trees" },
  "material": { "title": "BST notes", "file_type": "pdf", "storage_path": "materials/userId/file.pdf" }
}
*/

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // TODO: Validate inputs, insert to subjects/materials tables,
    // enqueue background job (via Supabase Task or external worker) to:
    // 1) Fetch file from Storage
    // 2) Extract text/pages (PDF parser / OCR)
    // 3) Chunk text
    // 4) Generate embeddings and store in embeddings table
    // 5) Optionally pre-generate assets (summary/MCQ/flashcards) per material

    return new Response(JSON.stringify({ status: 'accepted', received: body }), {
      status: 202,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
