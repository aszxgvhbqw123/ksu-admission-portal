// Supabase Cloud Storage Service - Professional Edition
const SUPABASE_URL = 'https://icinkhzmnigfbclngeaj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_b64vprdDuB3YgM1rmEZwfQ_lRgG78Oo';

let supabaseClient = null;

function initSupabase() {
    if (typeof supabase !== 'undefined' && !supabaseClient) {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn('Supabase init failed:', e);
        }
    }
}

const CloudDB = {
    _initialized: false,
    _tableMap: {
        user_data: 'students',
        academic_data: 'academic_records',
        preferences: 'preferences',
        payment_data: 'payments',
        admin_users: 'admin_users',
        fee_structure: 'fee_structure'
    },

    init() {
        initSupabase();
        this._initialized = true;
    },

    _table(key) { return this._tableMap[key] || key; },

    _toSnake(obj) {
        const r = {};
        for (const [k, v] of Object.entries(obj || {})) {
            r[k.replace(/([A-Z])/g, '_$1').toLowerCase()] = v;
        }
        return r;
    },

    _toCamel(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(i => this._toCamel(i));
        const r = {};
        for (const [k, v] of Object.entries(obj)) {
            if (['id', 'created_at', 'updated_at', 'registered_at'].includes(k)) continue;
            r[k.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = v;
        }
        return r;
    },

    _client() {
        initSupabase();
        return supabaseClient;
    },

    _apiHeaders() {
        return {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        };
    },

    async _fetch(path, opts = {}) {
        const url = `${SUPABASE_URL}${path}`;
        const res = await fetch(url, {
            headers: this._apiHeaders(),
            ...opts
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`HTTP ${res.status}: ${err}`);
        }
        return res;
    },

    async save(key, data) {
        const table = this._table(key);
        const row = { ...this._toSnake(data), created_at: new Date().toISOString() };

        // Try SDK first
        const client = this._client();
        if (client) {
            try {
                const { error } = await client.from(table).insert(row);
                if (error) throw error;
                localStorage.setItem(`_cloud_${key}`, JSON.stringify(data));
                console.log(`[CloudDB] Saved ${key} to ${table}`);
                return true;
            } catch (e) {
                console.warn(`[CloudDB] SDK insert failed for ${key}:`, e.message);
            }
        }

        // Fallback: direct REST API
        try {
            const res = await this._fetch(`/rest/v1/${table}`, {
                method: 'POST',
                body: JSON.stringify(row)
            });
            localStorage.setItem(`_cloud_${key}`, JSON.stringify(data));
            console.log(`[CloudDB] REST saved ${key} to ${table}`);
            return true;
        } catch (e) {
            console.error(`[CloudDB] All attempts failed for ${key}:`, e.message);
            throw e;
        }
    },

    async fetch(key) {
        const table = this._table(key);
        const client = this._client();

        if (client) {
            try {
                const { data, error } = await client.from(table)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1000);
                if (error) throw error;
                const camel = (data || []).map(r => this._toCamel(r));
                localStorage.setItem(`_cloud_all_${key}`, JSON.stringify(camel));
                return camel;
            } catch (e) {
                console.warn(`[CloudDB] SDK fetch failed for ${key}:`, e.message);
            }
        }

        try {
            const res = await this._fetch(`/rest/v1/${table}?select=*&order=created_at.desc&limit=1000`);
            const data = await res.json();
            const camel = (data || []).map(r => this._toCamel(r));
            localStorage.setItem(`_cloud_all_${key}`, JSON.stringify(camel));
            return camel;
        } catch (e) {
            console.error(`[CloudDB] REST fetch failed for ${key}:`, e.message);
            throw e;
        }
    },

    async fetchLatest(key) {
        const table = this._table(key);
        const client = this._client();

        if (client) {
            try {
                const { data, error } = await client.from(table)
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1);
                if (error) throw error;
                if (data && data.length > 0) {
                    const camel = this._toCamel(data[0]);
                    localStorage.setItem(`_cloud_${key}`, JSON.stringify(camel));
                    return camel;
                }
                return null;
            } catch (e) {
                console.warn(`[CloudDB] SDK fetchLatest failed for ${key}:`, e.message);
            }
        }

        try {
            const res = await this._fetch(`/rest/v1/${table}?select=*&order=created_at.desc&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const camel = this._toCamel(data[0]);
                localStorage.setItem(`_cloud_${key}`, JSON.stringify(camel));
                return camel;
            }
            return null;
        } catch (e) {
            console.error(`[CloudDB] REST fetchLatest failed for ${key}:`, e.message);
            throw e;
        }
    },

    async delete(key) {
        const table = this._table(key);
        const client = this._client();

        if (client) {
            try {
                await client.from(table).delete().neq('id', 0);
            } catch (e) {
                console.warn(`[CloudDB] SDK delete failed for ${key}:`, e.message);
            }
        }

        try {
            await this._fetch(`/rest/v1/${table}?id=neq.0`, { method: 'DELETE' });
        } catch (e) {
            console.warn(`[CloudDB] REST delete failed for ${key}:`, e.message);
        }

        localStorage.removeItem(`_cloud_${key}`);
        localStorage.removeItem(`_cloud_all_${key}`);
    },

    // Specific helpers
    async fetchFeeStructure() {
        const client = this._client();
        if (client) {
            try {
                const { data, error } = await client.from('fee_structure')
                    .select('*')
                    .order('updated_at', { ascending: false })
                    .limit(1);
                if (error) throw error;
                if (data && data.length > 0) {
                    const fs = { applicationFee: data[0].application_fee, colleges: data[0].colleges };
                    localStorage.setItem('fee_structure', JSON.stringify(fs));
                    return fs;
                }
                return null;
            } catch (e) { console.warn('[CloudDB] SDK fee fetch failed:', e.message); }
        }

        try {
            const res = await this._fetch('/rest/v1/fee_structure?select=*&order=updated_at.desc&limit=1');
            const data = await res.json();
            if (data && data.length > 0) {
                const fs = { applicationFee: data[0].application_fee, colleges: data[0].colleges };
                localStorage.setItem('fee_structure', JSON.stringify(fs));
                return fs;
            }
            return null;
        } catch (e) {
            console.warn('[CloudDB] REST fee fetch failed:', e.message);
            return null;
        }
    },

    async saveFeeStructure(data) {
        const payload = { application_fee: data.applicationFee, colleges: data.colleges, updated_at: new Date().toISOString() };
        const client = this._client();

        if (client) {
            try {
                const { data: existing } = await client.from('fee_structure').select('id').limit(1);
                if (existing && existing.length > 0) {
                    await client.from('fee_structure').update(payload).eq('id', existing[0].id);
                } else {
                    await client.from('fee_structure').insert(payload);
                }
                localStorage.setItem('fee_structure', JSON.stringify(data));
                return;
            } catch (e) { console.warn('[CloudDB] SDK fee save failed:', e.message); }
        }

        try {
            const res = await this._fetch('/rest/v1/fee_structure?select=id&limit=1');
            const existing = await res.json();
            if (existing && existing.length > 0) {
                await this._fetch(`/rest/v1/fee_structure?id=eq.${existing[0].id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload)
                });
            } else {
                await this._fetch('/rest/v1/fee_structure', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }
            localStorage.setItem('fee_structure', JSON.stringify(data));
        } catch (e) {
            console.warn('[CloudDB] REST fee save failed:', e.message);
        }
    },

    async fetchAdminUsers() {
        const client = this._client();
        if (client) {
            try {
                const { data, error } = await client.from('admin_users').select('*').order('registered_at', { ascending: false });
                if (error) throw error;
                const camel = (data || []).map(u => this._toCamel(u));
                localStorage.setItem('users', JSON.stringify(camel));
                return camel;
            } catch (e) { console.warn('[CloudDB] SDK users fetch failed:', e.message); }
        }

        try {
            const res = await this._fetch('/rest/v1/admin_users?select=*&order=registered_at.desc');
            const data = await res.json();
            const camel = (data || []).map(u => this._toCamel(u));
            localStorage.setItem('users', JSON.stringify(camel));
            return camel;
        } catch (e) {
            console.warn('[CloudDB] REST users fetch failed:', e.message);
            return [];
        }
    },

    async syncAllToLocal() {
        const results = {};
        for (const key of ['user_data', 'academic_data', 'preferences', 'payment_data']) {
            try {
                const records = await this.fetch(key);
                results[key] = records ? records.length : 0;
            } catch (e) {
                results[key] = -1;
            }
        }
        try {
            await this.fetchFeeStructure();
            await this.fetchAdminUsers();
        } catch (e) { /* ignore */ }
        return results;
    }
};

CloudDB.init();
