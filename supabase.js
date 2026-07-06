const API_BASE = '/api';

const CloudDB = {
    _initialized: false,

    init() {
        this._initialized = true;
    },

    async _api(path, method = 'GET', body = null, headers = {}) {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json', ...headers }
        };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${path}`, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        return data;
    },

    _adminToken() {
        try {
            const session = JSON.parse(localStorage.getItem('ksu_admin_session') || '{}');
            return session.token || null;
        } catch { return null; }
    },

    async save(key, data) {
        try {
            let result;
            switch (key) {
                case 'user_data':
                    result = await this._api('/signup', 'POST', {
                        fullName: data.fullNameArabic || data.fullName,
                        nationalId: data.nationalID || data.nationalId,
                        phone: data.mobile || data.phone || '',
                        email: data.email || '',
                        nationality: data.nationality || 'saudi',
                        fullNameEn: data.fullNameEnglish || ''
                    });
                    if (result.user) {
                        localStorage.setItem('ksu_user_id', result.user.id);
                        localStorage.setItem('ksu_user_national_id', result.user.national_id);
                    }
                    break;
                case 'academic_data':
                    const userId = localStorage.getItem('ksu_user_id');
                    result = await this._api('/academic', 'POST', {
                        userId: userId || data.userId,
                        highSchoolGpa: parseFloat(data.highSchoolGPA) || 0,
                        quduratScore: parseFloat(data.quduratScore) || 0,
                        tahsiliScore: parseFloat(data.tahsiliScore) || 0,
                        weightedAverage: parseFloat(data.weightedAverage) || 0,
                        highSchoolType: data.highSchoolType || 'scientific',
                        graduationYear: data.graduationYear || ''
                    });
                    break;
                case 'payment_data':
                    const uid = localStorage.getItem('ksu_user_id');
                    result = await this._api('/subscription', 'POST', {
                        userId: uid || data.userId,
                        gatewayToken: data.gatewayToken || ('tok_sub_ksu_' + Date.now()),
                        maskedCard: data.cardNumber ? '****-****-****-' + data.cardNumber.slice(-4) : '',
                        cardholderName: data.cardholderName || '',
                        paymentMethod: data.paymentMethod || 'mada',
                        totalAmount: parseFloat(data.totalAmount) || 200,
                        transactionId: data.transactionId || ('TXN-' + Date.now())
                    });
                    break;
                case 'preferences':
                    result = await this._api('/preferences', 'POST', {
                        userId: localStorage.getItem('ksu_user_id') || '',
                        preferences: Array.isArray(data) ? data : [],
                        totalAmount: parseFloat(localStorage.getItem('payment_data') ? JSON.parse(localStorage.getItem('payment_data')).totalAmount : 200)
                    });
                    break;
                default:
                    localStorage.setItem(`_cloud_${key}`, JSON.stringify(data));
                    return true;
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
        const token = this._adminToken();
        try {
            if (key === 'fee_structure') return await this.fetchFeeStructure();
            if (key === 'admin_users') return await this.fetchAdminUsers();

            if (key.startsWith('all_')) {
                const students = await this._api('/admin/students', 'GET', null, {
                    'x-admin-token': token || ''
                });
                const records = students.students || [];
                if (key === 'all_user_data') {
                    localStorage.setItem('_cloud_all_user_data', JSON.stringify(records.map(s => ({ data: s }))));
                    return records.map(s => ({ data: s }));
                }
                if (key === 'all_payment_data') {
                    const payments = records.filter(s => s.subscription).map(s => ({
                        data: { ...s.subscription, studentEmail: s.email, studentNationalID: s.national_id, studentName: s.full_name }
                    }));
                    localStorage.setItem('_cloud_all_payment_data', JSON.stringify(payments));
                    return payments;
                }
                if (key === 'all_academic_data') {
                    const acad = records.filter(s => s.academic).map(s => ({
                        data: { ...s.academic, studentEmail: s.email }
                    }));
                    localStorage.setItem('_cloud_all_academic_data', JSON.stringify(acad));
                    return acad;
                }
                return [];
            }

            const fallback = localStorage.getItem(`_cloud_all_${key}`);
            if (fallback) {
                try { return JSON.parse(fallback); } catch { return []; }
            }
            return [];
        } catch (e) {
            console.warn(`[CloudDB] fetch failed for ${key}:`, e.message);
            const fallback = localStorage.getItem(`_cloud_all_${key}`);
            if (fallback) { try { return JSON.parse(fallback); } catch { return []; } }
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
        if (fallback) { try { return JSON.parse(fallback); } catch { return null; } }
        return null;
    },

    async delete(key) {
        try {
            localStorage.removeItem(`_cloud_${key}`);
            localStorage.removeItem(`_cloud_all_${key}`);
        } catch { }
    },

    async fetchFeeStructure() {
        const token = this._adminToken();
        try {
            const students = await this._api('/admin/students', 'GET', null, {
                'x-admin-token': token || ''
            });
            const defaultFees = this.getDefaultFeeStructure();
            localStorage.setItem('fee_structure', JSON.stringify(defaultFees));
            return defaultFees;
        } catch (e) {
            console.warn('[CloudDB] fee fetch failed:', e.message);
            const fallback = localStorage.getItem('fee_structure');
            if (fallback) { try { return JSON.parse(fallback); } catch { } }
            return this.getDefaultFeeStructure();
        }
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
