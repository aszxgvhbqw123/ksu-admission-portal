// Supabase Cloud Storage Service
// Uses Supabase JS Client (loaded from CDN) for all CRUD operations

let supabaseClient = null;

// Wait for Supabase lib to load, then initialize
function initSupabase() {
    if (typeof supabase !== 'undefined' && !supabaseClient) {
        supabaseClient = supabase.createClient(
            'https://icinkhzmnigfbclngeaj.supabase.co',
            'sb_publishable_b64vprdDuB3YgM1rmEZwfQ_lRgG78Oo'
        );
        console.log('Supabase client initialized');
    }
}

const SupabaseService = {
    tableMap: {
        user_data: 'students',
        academic_data: 'academic_records',
        preferences: 'preferences',
        payment_data: 'payments'
    },

    mapKey(key) { return this.tableMap[key] || key; },

    // Transform camelCase keys to snake_case for DB columns
    toSnake(obj) {
        const result = {};
        for (const [key, val] of Object.entries(obj || {})) {
            const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            result[snake] = val;
        }
        return result;
    },

    // Transform snake_case keys back to camelCase for JS
    toCamel(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(i => this.toCamel(i));
        const result = {};
        for (const [key, val] of Object.entries(obj)) {
            if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'registered_at') continue;
            const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            result[camel] = val;
        }
        return result;
    },

    async ensureClient() {
        initSupabase();
        if (!supabaseClient) {
            // Fallback: try direct REST API with anon key
            if (!this._fallback) this._fallback = { url: 'https://icinkhzmnigfbclngeaj.supabase.co', anonKey: 'sb_publishable_b64vprdDuB3YgM1rmEZwfQ_lRgG78Oo' };
            return false;
        }
        return true;
    },

    async save(key, data) {
        const table = this.mapKey(key);
        const snakeData = this.toSnake(data);
        const row = { ...snakeData, created_at: new Date().toISOString() };
        
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { data: result, error } = await supabaseClient.from(table).insert(row).select();
            if (error) { console.warn('Supabase save error:', error); return null; }
            localStorage.setItem(key, JSON.stringify(data));
            return result ? { data: result[0] || result } : null;
        }
        
        // Fallback: localStorage only
        localStorage.setItem(key, JSON.stringify(data));
        return { data };
    },

    async getCurrent(key) {
        const table = this.mapKey(key);
        const hasSDK = await this.ensureClient();
        
        if (hasSDK && supabaseClient) {
            const { data: result, error } = await supabaseClient.from(table).select('*').order('created_at', { ascending: false }).limit(1);
            if (!error && result && result.length > 0) {
                const camelData = this.toCamel(result[0]);
                localStorage.setItem(key, JSON.stringify(camelData));
                return camelData;
            }
        }
        
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },

    async getHistory(key) {
        const table = this.mapKey(key);
        const hasSDK = await this.ensureClient();
        
        if (hasSDK && supabaseClient) {
            const { data: result, error } = await supabaseClient.from(table).select('*').order('created_at', { ascending: false }).limit(1000);
            if (!error && result) {
                const history = result.map(r => this.toCamel(r));
                localStorage.setItem(`all_${key}`, JSON.stringify(history));
                return history;
            }
        }
        
        try { return JSON.parse(localStorage.getItem(`all_${key}`) || '[]'); } catch { return []; }
    },

    async clear(key) {
        const table = this.mapKey(key);
        const hasSDK = await this.ensureClient();
        
        if (hasSDK && supabaseClient) {
            const { error } = await supabaseClient.from(table).delete().neq('id', 0);
            if (error) console.warn('Supabase delete error:', error);
        }
        
        localStorage.removeItem(key);
        localStorage.removeItem(`all_${key}`);
    },

    async getUsers() {
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { data, error } = await supabaseClient.from('admin_users').select('*').order('registered_at', { ascending: false });
            if (!error && data) { const camel = data.map(u => this.toCamel(u)); localStorage.setItem('users', JSON.stringify(camel)); return camel; }
        }
        try { return JSON.parse(localStorage.getItem('users') || '[]'); } catch { return []; }
    },

    async addUser(user) {
        const row = { ...this.toSnake(user), registered_at: new Date().toISOString(), is_admin_added: true };
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { error } = await supabaseClient.from('admin_users').insert(row);
            if (error) console.warn('Supabase addUser error:', error);
        }
        return await this.getUsers();
    },

    async deleteUser(nationalId) {
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { error } = await supabaseClient.from('admin_users').delete().eq('national_id', nationalId);
            if (error) console.warn('Supabase deleteUser error:', error);
        }
        return await this.getUsers();
    },

    async getFeeStructure() {
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { data, error } = await supabaseClient.from('fee_structure').select('*').order('updated_at', { ascending: false }).limit(1);
            if (!error && data && data.length > 0) {
                const item = data[0];
                const feeData = { applicationFee: item.application_fee, colleges: item.colleges };
                localStorage.setItem('fee_structure', JSON.stringify(feeData));
                return feeData;
            }
        }
        try { const v = JSON.parse(localStorage.getItem('fee_structure')); return v; } catch { return null; }
    },

    async saveFeeStructure(data) {
        const payload = { application_fee: data.applicationFee, colleges: data.colleges, updated_at: new Date().toISOString() };
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { data: existing, error: getErr } = await supabaseClient.from('fee_structure').select('id').limit(1);
            if (!getErr && existing && existing.length > 0) {
                await supabaseClient.from('fee_structure').update(payload).eq('id', existing[0].id);
            } else {
                await supabaseClient.from('fee_structure').insert(payload);
            }
        }
        localStorage.setItem('fee_structure', JSON.stringify(data));
    },

    async createSession(email) {
        const token = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 10);
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { error } = await supabaseClient.from('auth_tokens').insert({ user_email: email, token });
            if (error) console.warn('Supabase createSession error:', error);
        }
        localStorage.setItem('session_token', token);
        return token;
    },

    async validateSession(token) {
        const hasSDK = await this.ensureClient();
        if (hasSDK && supabaseClient) {
            const { data, error } = await supabaseClient.from('auth_tokens').select('*').eq('token', token).gt('expires_at', new Date().toISOString());
            return !error && data && data.length > 0;
        }
        return false;
    }
};

// Auto-init if supabase SDK is already loaded
initSupabase();
