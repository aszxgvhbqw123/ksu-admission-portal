const SUPABASE_URL = 'https://icinkhzmnigfbclngeaj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_b64vprdDuB3YgM1rmEZwfQ_lRgG78Oo';

function _supaFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };
  if (!options.headers || !options.headers['Prefer']) {
    headers['Prefer'] = 'return=representation';
  }
  return fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  }).then(async r => {
    const data = await r.json();
    if (!r.ok) throw { status: r.status, error: data, message: data.message || `HTTP ${r.status}` };
    return data;
  });
}

const CloudDB = {
  init() {},

  async save(key, data) {
    try {
      let result, userId;
      switch (key) {
        case 'user_data': {
          const body = {
            full_name: data.fullNameArabic || data.fullName,
            full_name_en: data.fullNameEnglish || '',
            national_id: data.nationalID || data.nationalId,
            phone: data.mobile || data.phone || '',
            email: data.email || '',
            nationality: data.nationality || 'saudi'
          };
          const existing = await _supaFetch(`/profiles?national_id=eq.${encodeURIComponent(body.national_id)}&select=id`);
          if (existing && existing.length > 0) {
            userId = existing[0].id;
            result = await _supaFetch(`/profiles?id=eq.${userId}`, {
              method: 'PATCH', body
            });
          } else {
            result = await _supaFetch('/profiles', { method: 'POST', body });
            userId = result[0] && result[0].id ? result[0].id : result.id;
          }
          if (userId) {
            localStorage.setItem('ksu_user_id', userId);
            localStorage.setItem('ksu_user_national_id', body.national_id);
          }
          break;
        }
        case 'academic_data': {
          userId = localStorage.getItem('ksu_user_id');
          if (!userId) throw new Error('No user ID found');
          const body = {
            user_id: userId,
            high_school_gpa: parseFloat(data.highSchoolGPA) || 0,
            qudurat_score: parseFloat(data.quduratScore) || 0,
            tahsili_score: parseFloat(data.tahsiliScore) || 0,
            weighted_average: parseFloat(data.weightedAverage) || 0,
            high_school_type: data.highSchoolType || 'scientific',
            graduation_year: data.graduationYear || '',
            updated_at: new Date().toISOString()
          };
          const existing = await _supaFetch(`/academic_records?user_id=eq.${encodeURIComponent(userId)}&select=id`);
          if (existing && existing.length > 0) {
            result = await _supaFetch(`/academic_records?user_id=eq.${encodeURIComponent(userId)}`, {
              method: 'PATCH', body
            });
          } else {
            body.created_at = new Date().toISOString();
            result = await _supaFetch('/academic_records', { method: 'POST', body });
          }
          break;
        }
        case 'payment_data': {
          userId = localStorage.getItem('ksu_user_id');
          if (!userId) throw new Error('No user ID found');
          const body = {
            user_id: userId,
            gateway_token: data.gatewayToken || ('tok_sub_ksu_' + Date.now()),
            masked_card: data.cardNumber ? '****-****-****-' + data.cardNumber.slice(-4) : '',
            cardholder_name: data.cardholderName || '',
            payment_method: data.paymentMethod || 'mada',
            total_amount: parseFloat(data.totalAmount) || 200,
            transaction_id: data.transactionId || ('TXN-' + Date.now()),
            billing_status: 'active',
            next_payment_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          };
          const existing = await _supaFetch(`/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=id`);
          if (existing && existing.length > 0) {
            result = await _supaFetch(`/subscriptions?user_id=eq.${encodeURIComponent(userId)}`, {
              method: 'PATCH', body
            });
          } else {
            body.created_at = new Date().toISOString();
            result = await _supaFetch('/subscriptions', { method: 'POST', body });
          }
          break;
        }
        case 'preferences': {
          userId = localStorage.getItem('ksu_user_id');
          if (!userId) throw new Error('No user ID found');
          const prefText = JSON.stringify((Array.isArray(data) ? data : []).map(p => ({
            collegeName: p.collegeName || p.name || '',
            collegeId: p.collegeId || p.id || '',
            trackType: p.trackType || '',
            order: p.order || 0
          })));
          const totalAmt = parseFloat(localStorage.getItem('payment_data')
            ? JSON.parse(localStorage.getItem('payment_data')).totalAmount : 200);
          const body = {
            user_id: userId,
            preferences: prefText,
            total_amount: totalAmt,
            status: 'pending',
            updated_at: new Date().toISOString()
          };
          const existing = await _supaFetch(`/applications?user_id=eq.${encodeURIComponent(userId)}&select=id`);
          if (existing && existing.length > 0) {
            result = await _supaFetch(`/applications?user_id=eq.${encodeURIComponent(userId)}`, {
              method: 'PATCH', body
            });
          } else {
            body.submitted_at = new Date().toISOString();
            body.created_at = new Date().toISOString();
            result = await _supaFetch('/applications', { method: 'POST', body });
          }
          break;
        }
        default: {
          localStorage.setItem(`_cloud_${key}`, JSON.stringify(data));
          return true;
        }
      }
      localStorage.setItem(`_cloud_${key}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn(`[CloudDB] save failed for ${key}:`, e.message);
      localStorage.setItem(`_cloud_${key}`, JSON.stringify(data));
      return false;
    }
  },

  async fetch(key, limit = 1000) {
    try {
      if (key === 'all_user_data') {
        const data = await _supaFetch(`/profiles?order=created_at.desc&limit=${limit}`);
        localStorage.setItem('_cloud_all_user_data', JSON.stringify(data.map(s => ({ data: s }))));
        return data.map(s => ({ data: s }));
      }
      if (key === 'all_payment_data') {
        const data = await _supaFetch(`/subscriptions?order=created_at.desc&limit=${limit}`);
        const users = await _supaFetch('/profiles?select=id,full_name,email,national_id');
        const userMap = {};
        (users || []).forEach(u => { userMap[u.id] = u; });
        const payments = (data || []).map(s => ({
          data: { ...s, studentEmail: userMap[s.user_id]?.email || '', studentNationalID: userMap[s.user_id]?.national_id || '', studentName: userMap[s.user_id]?.full_name || '' }
        }));
        localStorage.setItem('_cloud_all_payment_data', JSON.stringify(payments));
        return payments;
      }
      if (key === 'all_academic_data') {
        const data = await _supaFetch(`/academic_records?order=created_at.desc&limit=${limit}`);
        const users = await _supaFetch('/profiles?select=id,email');
        const userMap = {};
        (users || []).forEach(u => { userMap[u.id] = u; });
        const acad = (data || []).map(r => ({
          data: { ...r, studentEmail: userMap[r.user_id]?.email || '' }
        }));
        localStorage.setItem('_cloud_all_academic_data', JSON.stringify(acad));
        return acad;
      }
      if (key === 'fee_structure') return await this.fetchFeeStructure();
      const fallback = localStorage.getItem(`_cloud_all_${key}`);
      if (fallback) { try { return JSON.parse(fallback); } catch { return []; } }
      return [];
    } catch (e) {
      console.warn(`[CloudDB] fetch failed for ${key}:`, e.message);
      const fallback = localStorage.getItem(`_cloud_all_${key}`);
      if (fallback) { try { return JSON.parse(fallback); } catch { } }
      return [];
    }
  },

  async fetchLatest(key) {
    const all = await this.fetch(key, 1);
    if (all && all.length > 0) {
      const item = all[0].data || all[0];
      localStorage.setItem(`_cloud_${key}`, JSON.stringify(item));
      return item;
    }
    const fallback = localStorage.getItem(`_cloud_${key}`);
    if (fallback) { try { return JSON.parse(fallback); } catch { } }
    return null;
  },

  async delete(key) {
    try {
      localStorage.removeItem(`_cloud_${key}`);
      localStorage.removeItem(`_cloud_all_${key}`);
    } catch { }
  },

  getDefaultFeeStructure() {
    return {
      applicationFee: 200,
      colleges: {
        'الأمن السيبراني الطبي': { saudi: 12000, nonSaudi: 75000, diploma: 4500 },
        'إدارة المستشفيات': { saudi: 10000, nonSaudi: 70000, diploma: 4200 },
        'التقنية الصحية': { saudi: 12000, nonSaudi: 80000, diploma: 4800 },
        'الأشعة التشخيصية': { saudi: 13000, nonSaudi: 85000, diploma: 4600 },
        'التمريض العام': { saudi: 11000, nonSaudi: 75000, diploma: 4400 },
        'الأمن السيبراني': { saudi: 12000, nonSaudi: 75000, diploma: 4000 },
        'علوم الحاسب': { saudi: 10000, nonSaudi: 70000, diploma: 3500 },
        'الشبكات والاتصالات': { saudi: 10000, nonSaudi: 65000, diploma: 3800 },
        'هندسة البرمجيات': { saudi: 10000, nonSaudi: 70000, diploma: 3600 },
        'الذكاء الاصطناعي': { saudi: 12000, nonSaudi: 80000, diploma: 4200 },
        'أنظمة المعلومات': { saudi: 9000, nonSaudi: 65000, diploma: 3400 },
        'إدارة البيانات وتحليلها': { saudi: 10000, nonSaudi: 70000, diploma: 3700 },
        'إدارة الأعمال': { saudi: 8000, nonSaudi: 55000, diploma: 2800 },
        'المحاسبة والمراجعة': { saudi: 8000, nonSaudi: 55000, diploma: 2500 },
        'التسويق الرقمي': { saudi: 8000, nonSaudi: 55000, diploma: 3000 },
        'الموارد البشرية': { saudi: 7000, nonSaudi: 50000, diploma: 2700 },
        'إدارة المشاريع': { saudi: 8000, nonSaudi: 55000, diploma: 2900 },
        'إدارة اللوجستيات وسلاسل الإمداد': { saudi: 8000, nonSaudi: 55000, diploma: 3100 },
        'المالية والاستثمار': { saudi: 9000, nonSaudi: 60000, diploma: 3200 },
        'اللغات والترجمة': { saudi: 5000, nonSaudi: 45000, diploma: 2200 },
        'القانون': { saudi: 7000, nonSaudi: 50000, diploma: 2000 },
        'الإعلام الرقمي': { saudi: 6000, nonSaudi: 45000, diploma: 2400 },
        'علم النفس التطبيقي': { saudi: 5000, nonSaudi: 40000, diploma: 2100 },
        'التربية الخاصة': { saudi: 5000, nonSaudi: 40000, diploma: 2000 },
        'التاريخ والحضارة الإسلامية': { saudi: 4000, nonSaudi: 35000, diploma: 1800 },
        'الإرشاد النفسي': { saudi: 5000, nonSaudi: 40000, diploma: 2300 }
      }
    };
  },

  async fetchFeeStructure() {
    try {
      const data = this.getDefaultFeeStructure();
      localStorage.setItem('fee_structure', JSON.stringify(data));
      return data;
    } catch (e) {
      const fallback = localStorage.getItem('fee_structure');
      if (fallback) { try { return JSON.parse(fallback); } catch { } }
      return this.getDefaultFeeStructure();
    }
  },

  async saveFeeStructure(data) {
    localStorage.setItem('fee_structure', JSON.stringify(data));
  },

  async fetchAdminUsers() {
    try {
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      return users.map(u => {
        const { password, ...safe } = u;
        return safe;
      });
    } catch { return []; }
  },

  async syncAllToLocal() {
    const results = {};
    for (const key of ['all_user_data', 'all_academic_data', 'all_payment_data']) {
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
    } catch { }
    return results;
  }
};

CloudDB.init();
