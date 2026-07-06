// Shared Supabase client factory for API routes
// Uses service_role key for admin operations (server-side only)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient(useServiceRole = false) {
  const key = useServiceRole && SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  return createClient(SUPABASE_URL, key);
}

function getServiceClient() {
  return getClient(true);
}

function getAnonClient() {
  return getClient(false);
}

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
  'Content-Type': 'application/json; charset=utf-8'
};

// Standard response helpers
function ok(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders
  });
}

function fail(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: corsHeaders
  });
}

module.exports = {
  getClient,
  getServiceClient,
  getAnonClient,
  corsHeaders,
  ok,
  fail
};
