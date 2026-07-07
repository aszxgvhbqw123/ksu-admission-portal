const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function supaFetch(path, options = {}) {
  const baseUrl = `${SUPABASE_URL}/rest/v1`;
  const url = path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  const key = options.serviceRole && SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };
  const fetchOpts = { method: options.method || 'GET', headers };
  if (options.body) fetchOpts.body = JSON.stringify(options.body);
  if ((options.method === 'GET' || options.method === 'PATCH') && options.query) {
    const params = new URLSearchParams();
    Object.entries(options.query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return fetch(qs ? `${url}?${qs}` : url, fetchOpts);
  }
  return fetch(url, fetchOpts);
}

function buildSelectChain(table, query = {}, serviceRole = true) {
  const chain = {
    eq: (col, val) => { query[col] = `eq.${val}`; return chain; },
    in: (col, vals) => { query[col] = `in.(${vals.join(',')})`; return chain; },
    order: (col, opts = {}) => {
      const dir = opts.ascending === false ? 'desc' : 'asc';
      if (query.order) { query.order += `,${col}.${dir}`; }
      else { query.order = `${col}.${dir}`; }
      return chain;
    },
    limit: (n) => { query.limit = String(n); return chain; },
    maybeSingle: async () => {
      query.limit = '1';
      const res = await supaFetch(table, { method: 'GET', query, serviceRole });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data };
      return { data: data[0] || null, error: null };
    },
    single: async () => {
      query.limit = '1';
      const res = await supaFetch(table, { method: 'GET', query, serviceRole });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data };
      return { data: data[0] || null, error: null };
    },
    then: async (resolve) => {
      const res = await supaFetch(table, { method: 'GET', query, serviceRole });
      const data = await res.json();
      if (!res.ok) return resolve({ data: null, error: data });
      return resolve({ data, error: null });
    }
  };
  return chain;
}

function getServiceClient() {
  return {
    from: (table) => ({
      select: (columns = '*') => {
        return buildSelectChain(table, { select: columns }, true);
      },
      insert: (payload) => {
        const query = {};
        return {
          select: () => ({
            single: async () => {
              const res = await supaFetch(table, {
                method: 'POST',
                body: payload,
                serviceRole: true,
                headers: { 'Prefer': 'return=representation' }
              });
              const data = await res.json();
              if (!res.ok) return { data: null, error: data };
              return { data: data[0] || data, error: null };
            }
          }),
          then: async (resolve) => {
            const res = await supaFetch(table, { method: 'POST', body: payload, serviceRole: true });
            const data = await res.json();
            if (!res.ok) return resolve({ data: null, error: data });
            return resolve({ data, error: null });
          }
        };
      },
      update: (payload) => {
        const query = {};
        const eqChain = {
          eq: (col, val) => {
            query[col] = `eq.${val}`;
            return {
              select: () => ({
                single: async () => {
                  const params = new URLSearchParams();
                  Object.entries(query).forEach(([k, v]) => params.set(k, String(v)));
                  const qs = params.toString();
                  const res = await supaFetch(`${table}?${qs}`, {
                    method: 'PATCH',
                    body: payload,
                    serviceRole: true,
                    headers: { 'Prefer': 'return=representation' }
                  });
                  const data = await res.json();
                  if (!res.ok) return { data: null, error: data };
                  return { data: data[0] || data, error: null };
                }
              })
            };
          }
        };
        return eqChain;
      }
    })
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-token',
  'Content-Type': 'application/json; charset=utf-8'
};

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function fail(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

module.exports = { getServiceClient, corsHeaders, ok, fail };
