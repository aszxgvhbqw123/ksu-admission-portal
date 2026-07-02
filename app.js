// KSU Admission Portal - Main Application JavaScript

// Global State Management
const AppState = {
    currentUser: null,
    formData: {
        personal: {},
        academic: {},
        preferences: [],
        payment: {}
    },
    currentStep: 1,
    totalSteps: 5
};

// Cloud Sync Status
const CloudStatus = {
    ok: false,
    lastSync: null,
    pendingCount: 0,
    errorCount: 0,

    markOk() { this.ok = true; this.lastSync = Date.now(); },
    markError() { this.ok = false; this.errorCount++; },
    reset() { this.ok = false; this.lastSync = null; this.errorCount = 0; }
};

// Cloud Sync Engine - saves to Supabase with retry
const CloudSync = {
    _queue: [],
    _processing: false,

    async save(key, data) {
        try {
            CloudStatus.pendingCount++;
            await CloudDB.save(key, data);
            CloudStatus.markOk();
            console.log(`[CloudSync] Saved ${key} to cloud`);
            return true;
        } catch (e) {
            CloudStatus.markError();
            console.warn(`[CloudSync] Failed ${key}:`, e.message);
            this._queue.push({ key, data, retries: 0 });
            return false;
        } finally {
            CloudStatus.pendingCount--;
        }
    },

    async delete(key) {
        try {
            await CloudDB.delete(key);
            return true;
        } catch (e) {
            console.warn(`[CloudSync] Delete failed ${key}:`, e.message);
            return false;
        }
    },

    async retryAll() {
        const items = [...this._queue];
        this._queue = [];
        for (const item of items) {
            try {
                item.retries++;
                await CloudDB.save(item.key, item.data);
                console.log(`[CloudSync] Retry OK: ${item.key}`);
            } catch (e) {
                if (item.retries < 3) {
                    this._queue.push(item);
                }
                console.warn(`[CloudSync] Retry ${item.retries}/3 failed: ${item.key}`);
            }
        }
    },

    async startAutoRetry(interval = 15000) {
        setInterval(() => {
            if (this._queue.length > 0) this.retryAll();
        }, interval);
    }
};

// Utility Functions
const Utils = {
    // Sanitize input to prevent XSS
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    // Validate Saudi National ID / Iqama (10 digits)
    validateNationalID: (id) => {
        const sanitized = Utils.sanitizeInput(id);
        return /^[0-9]{10}$/.test(sanitized);
    },

    // Validate Saudi Mobile Number
    validateSaudiMobile: (mobile) => {
        const sanitized = Utils.sanitizeInput(mobile);
        return /^05[0-9]{8}$/.test(sanitized) || /^5[0-9]{8}$/.test(sanitized);
    },

    // Validate Email
    validateEmail: (email) => {
        const sanitized = Utils.sanitizeInput(email);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(sanitized);
    },

    // Validate Strong Password
    validatePassword: (password) => {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    },

    // Format Saudi Mobile Number
    formatMobileNumber: (mobile) => {
        const sanitized = Utils.sanitizeInput(mobile);
        if (sanitized.length === 10 && sanitized.startsWith('5')) {
            return '0' + sanitized;
        }
        return sanitized;
    },

    // Show Toast Notification
    showToast: (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    // Show Modal
    showModal: (content) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    },

    // Close Modal
    closeModal: () => {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    // Show MFA Modal
    showMFAModal: (mobileNumber) => {
        const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
        localStorage.setItem('mfa_code', mfaCode);
        localStorage.setItem('mfa_mobile', mobileNumber);
        
        Utils.showModal(`
            <div>
                <h3 class="text-lg font-bold text-ksu-primary mb-4">المصادقة الثنائية</h3>
                <p class="text-gray-600 mb-4 text-sm">تم إرسال رمز التحقق إلى جوالك المسجل</p>
                <p class="text-xs text-gray-500 mb-4">الرمز التجريبي: ${mfaCode}</p>
                
                <div class="mb-4">
                    <label class="form-label">رمز التحقق</label>
                    <input type="text" id="mfaCode" class="form-input text-center text-2xl tracking-widest" placeholder="000000" maxlength="6">
                </div>
                
                <div class="flex space-x-3 space-x-reverse">
                    <button onclick="verifyMFA('${mobileNumber}')" class="flex-1 bg-ksu-primary text-white py-2 rounded-lg font-bold">
                        تحقق
                    </button>
                    <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold">
                        إلغاء
                    </button>
                </div>
                
                <p class="text-center text-xs text-gray-500 mt-4">
                    لم يصلك الرمز؟ 
                    <a href="#" onclick="resendMFA()" class="text-ksu-primary hover:underline">إعادة الإرسال</a>
                </p>
            </div>
        `);
    }
};

// Security Functions
const Security = {
    // Generate CSRF Token (placeholder)
    generateCSRFToken: () => {
        return 'csrf_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    },

    // Verify MFA Code
    verifyMFA: (mobileNumber) => {
        const inputCode = document.getElementById('mfaCode').value;
        const storedCode = localStorage.getItem('mfa_code');
        const storedMobile = localStorage.getItem('mfa_mobile');

        if (inputCode === storedCode && mobileNumber === storedMobile) {
            localStorage.removeItem('mfa_code');
            localStorage.removeItem('mfa_mobile');
            Utils.closeModal();
            Utils.showToast('تم التحقق بنجاح', 'success');
            return true;
        } else {
            Utils.showToast('رمز التحقق غير صحيح', 'error');
            return false;
        }
    },

    // Resend MFA Code
    resendMFA: () => {
        const mobileNumber = localStorage.getItem('mfa_mobile');
        if (mobileNumber) {
            Utils.closeModal();
            Utils.showMFAModal(mobileNumber);
            Utils.showToast('تم إعادة إرسال الرمز', 'success');
        }
    },

    // Validate form data before submission
    validateFormData: (data) => {
        const errors = [];
        
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'string') {
                if (data[key].includes('<') || data[key].includes('>') || data[key].includes('script')) {
                    errors.push(`حقل ${key} يحتوي على قيم غير صالحة`);
                }
            }
        });
        
        return errors;
    },

    // Rate limiting for API calls (placeholder)
    rateLimiter: {
        calls: [],
        maxCalls: 5,
        windowMs: 60000, // 1 minute
        
        check: function() {
            const now = Date.now();
            this.calls = this.calls.filter(call => now - call < this.windowMs);
            
            if (this.calls.length >= this.maxCalls) {
                return false;
            }
            
            this.calls.push(now);
            return true;
        }
    }
};

// Weighted Average Calculator
const WeightedAverageCalculator = {
    // KSU Standard Formula (2026)
    // Weighted Average = (High School GPA × 40%) + (Qudurat × 30%) + (Tahsili × 30%)
    calculate: (highSchoolGPA, quduratScore, tahsiliScore) => {
        const gpa = parseFloat(highSchoolGPA) || 0;
        const qudurat = parseFloat(quduratScore) || 0;
        const tahsili = parseFloat(tahsiliScore) || 0;
        
        const weightedAverage = (gpa * 0.40) + (qudurat * 0.30) + (tahsili * 0.30);
        return weightedAverage.toFixed(2);
    },

    // Get eligibility for tracks based on weighted average
    getEligibility: (weightedAverage) => {
        const wa = parseFloat(weightedAverage);
        
        return {
            health: wa >= 90,
            engineering: wa >= 85,
            science: wa >= 80,
            humanities: wa >= 70
        };
    }
};

// Form Validation
const FormValidator = {
    validateSignupForm: (formData) => {
        const errors = [];
        
        if (!formData.fullNameArabic || formData.fullNameArabic.trim().length < 3) {
            errors.push('الاسم بالعربية يجب أن يكون 3 أحرف على الأقل');
        }
        
        if (!formData.fullNameEnglish || formData.fullNameEnglish.trim().length < 3) {
            errors.push('الاسم بالإنجليزية يجب أن يكون 3 أحرف على الأقل');
        }
        
        if (!Utils.validateNationalID(formData.nationalID)) {
            errors.push('رقم الهوية/الإقامة يجب أن يكون 10 أرقام');
        }
        
        if (!Utils.validateEmail(formData.email)) {
            errors.push('البريد الإلكتروني غير صالح');
        }
        
        if (!Utils.validateSaudiMobile(formData.mobile)) {
            errors.push('رقم الجوال يجب أن يكون بصيغة سعودية (05xxxxxxxx)');
        }
        
        if (!Utils.validatePassword(formData.password)) {
            errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز خاص');
        }
        
        if (formData.password !== formData.confirmPassword) {
            errors.push('كلمة المرور غير متطابقة');
        }
        
        if (!formData.termsAccepted) {
            errors.push('يجب الموافقة على الشروط والأحكام');
        }
        
        return errors;
    },

    validateLoginForm: (formData) => {
        const errors = [];
        
        if (!formData.identifier || formData.identifier.trim().length < 3) {
            errors.push('رقم الهوية أو البريد الإلكتروني مطلوب');
        }
        
        if (!formData.password || formData.password.length < 1) {
            errors.push('كلمة المرور مطلوبة');
        }
        
        return errors;
    },

    validateAcademicForm: (formData) => {
        const errors = [];
        
        if (!formData.graduationYear || formData.graduationYear < 2015 || formData.graduationYear > 2026) {
            errors.push('سنة التخرج يجب أن تكون بين 2015 و 2026');
        }
        
        const gpa = parseFloat(formData.highSchoolGPA);
        if (!gpa || gpa < 50 || gpa > 100) {
            errors.push('المعدل الثانوي يجب أن يكون بين 50 و 100');
        }
        
        const qudurat = parseFloat(formData.quduratScore);
        if (!qudurat || qudurat < 0 || qudurat > 100) {
            errors.push('درجة القدرات يجب أن تكون بين 0 و 100');
        }
        
        const tahsili = parseFloat(formData.tahsiliScore);
        if (!tahsili || tahsili < 0 || tahsili > 100) {
            errors.push('درجة التحصيلي يجب أن تكون بين 0 و 100');
        }
        
        return errors;
    },

    validatePaymentForm: (formData) => {
        const errors = [];
        
        if (!formData.cardholderName || formData.cardholderName.trim().length < 3) {
            errors.push('اسم حامل البطاقة مطلوب');
        }
        
        if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
            errors.push('رقم البطاقة غير صالح');
        }
        
        if (!formData.expiryDate || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.expiryDate)) {
            errors.push('تاريخ الانتهاء يجب أن يكون بصيغة MM/YY');
        }
        
        if (!formData.cvv || formData.cvv.length < 3) {
            errors.push('رمز الأمان (CVV) مطلوب');
        }
        
        return errors;
    }
};

// Card Type Detection
const CardDetector = {
    detectCardType: (cardNumber) => {
        const sanitized = cardNumber.replace(/\s/g, '');
        
        if (/^4/.test(sanitized)) return 'visa';
        if (/^5[1-5]/.test(sanitized)) return 'mastercard';
        if (/^(4|5|6)/.test(sanitized) && sanitized.length === 16) return 'mada';
        if (/^3[47]/.test(sanitized)) return 'amex';
        
        return 'unknown';
    },

    getCardIcon: (cardType) => {
        const icons = {
            visa: '💳 Visa',
            mastercard: '💳 MasterCard',
            mada: '💳 مدى',
            amex: '💳 Amex',
            unknown: '💳'
        };
        return icons[cardType] || icons.unknown;
    }
};

// Format Card Number
const formatCardNumber = (cardNumber) => {
    const sanitized = cardNumber.replace(/\s/g, '');
    const formatted = sanitized.match(/.{1,4}/g)?.join(' ') || sanitized;
    return formatted;
};

// Format Expiry Date
const formatExpiryDate = (expiry) => {
    const sanitized = expiry.replace(/\D/g, '');
    if (sanitized.length >= 2) {
        return sanitized.substring(0, 2) + '/' + sanitized.substring(2, 4);
    }
    return sanitized;
};

// Persistent Data Store with History (localStorage + Cloud sync)
const DataStore = {
    save(key, data, sync = true) {
        localStorage.setItem(key, JSON.stringify(data));
        const historyKey = `all_${key}`;
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        const entry = { data: data, _savedAt: new Date().toISOString(), _id: Date.now() + '_' + Math.random().toString(36).substr(2, 5) };
        history.push(entry);
        localStorage.setItem(historyKey, JSON.stringify(history));
        // Cloud sync
        if (sync && typeof CloudSync !== 'undefined') {
            CloudSync.save(key, data);
        }
        return entry;
    },
    getCurrent(key) {
        // Try cloud cache first, then localStorage
        try {
            const cached = localStorage.getItem(`_cloud_${key}`);
            if (cached) return JSON.parse(cached);
        } catch (e) { /* ignore */ }
        try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
    },
    getHistory(key) {
        // Try cloud cache first (professionally formatted)
        try {
            const cached = localStorage.getItem(`_cloud_all_${key}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(r => ({
                        data: r,
                        _savedAt: r._savedAt || r.createdAt || new Date().toISOString(),
                        _id: r._id || Date.now() + '_' + Math.random().toString(36).substr(2, 5)
                    }));
                }
            }
        } catch (e) { /* ignore */ }
        // Fallback to local history
        const historyKey = `all_${key}`;
        try { return JSON.parse(localStorage.getItem(historyKey) || '[]'); } catch (e) { return []; }
    },
    clear(key) {
        localStorage.removeItem(key);
        localStorage.removeItem(`all_${key}`);
        localStorage.removeItem(`_cloud_${key}`);
        localStorage.removeItem(`_cloud_all_${key}`);
        if (typeof CloudSync !== 'undefined') CloudSync.delete(key);
    },
    async refreshFromCloud(key) {
        try {
            const records = await CloudDB.fetch(key);
            if (records && records.length > 0) {
                const wrapped = records.map(r => ({ data: r, _savedAt: r._savedAt || new Date().toISOString(), _id: Date.now() }));
                localStorage.setItem(`all_${key}`, JSON.stringify(wrapped));
                localStorage.setItem(key, JSON.stringify(records[records.length - 1]));
                return records;
            }
        } catch (e) {
            console.warn(`[DataStore] refreshFromCloud failed for ${key}:`, e.message);
        }
        return null;
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    // Set CSRF token
    const csrfToken = Security.generateCSRFToken();
    localStorage.setItem('csrf_token', csrfToken);
    
    console.log('KSU Admission Portal initialized');
    console.log('CSRF Token:', csrfToken);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, Security, WeightedAverageCalculator, FormValidator, CardDetector, DataStore };
}
