// Login Form Handler

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            identifier: document.getElementById('identifier').value,
            password: document.getElementById('password').value,
            rememberMe: document.getElementById('rememberMe').checked
        };

        // Validate form
        const errors = FormValidator.validateLoginForm(formData);
        
        if (errors.length > 0) {
            Utils.showModal(`
                <div class="text-center">
                    <div class="text-red-500 text-4xl mb-4">⚠️</div>
                    <h3 class="text-lg font-bold text-red-600 mb-4">خطأ في البيانات</h3>
                    <ul class="text-right text-sm space-y-2 mb-4">
                        ${errors.map(error => `<li class="text-red-600">• ${error}</li>`).join('')}
                    </ul>
                    <button onclick="Utils.closeModal()" class="bg-red-500 text-white px-6 py-2 rounded-lg">
                        إغلاق
                    </button>
                </div>
            `);
            return;
        }

        // Sanitize data
        const sanitizedData = {
            identifier: Utils.sanitizeInput(formData.identifier),
            rememberMe: formData.rememberMe
        };

        // Check rate limiting
        if (!Security.rateLimiter.check()) {
            Utils.showToast('يرجى الانتظار قبل المحاولة مرة أخرى', 'warning');
            return;
        }

        // Simulate API call
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner inline-block"></span> جاري تسجيل الدخول...';

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if user exists (in real app, this would be verified by backend)
            const storedUserData = localStorage.getItem('user_data');
            
            if (storedUserData) {
                const userData = JSON.parse(storedUserData);
                
                // Check if identifier matches
                const isValid = sanitizedData.identifier === userData.nationalID || 
                               sanitizedData.identifier === userData.email;
                
                if (isValid) {
                    // Set current user
                    AppState.currentUser = userData;
                    
                    if (sanitizedData.rememberMe) {
                        localStorage.setItem('remembered_user', JSON.stringify(userData));
                    }
                    
                    // Show MFA modal using centralized system
                    Utils.showMFAModal(userData.mobile || userData.nationalID);
                } else {
                    throw new Error('بيانات الدخول غير صحيحة');
                }
            } else {
                // For demo purposes, allow login with any credentials
                AppState.currentUser = {
                    fullNameArabic: 'محمد أحمد العلي',
                    fullNameEnglish: 'Mohammed Ahmed Al-Ali',
                    nationalID: sanitizedData.identifier,
                    mobile: sanitizedData.identifier
                };
                
                Utils.showMFAModal(sanitizedData.identifier);
            }
            
        } catch (error) {
            Utils.showToast(error.message || 'حدث خطأ أثناء تسجيل الدخول', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'تسجيل الدخول';
        }
    });
});

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

// Show Forgot Password Modal
function showForgotPassword() {
    Utils.showModal(`
        <div>
            <h3 class="text-lg font-bold text-ksu-green mb-4">استعادة كلمة المرور</h3>
            <p class="text-gray-600 mb-4 text-sm">أدخل رقم الهوية أو البريد الإلكتروني لإرسال رابط استعادة كلمة المرور</p>
            
            <div class="mb-4">
                <label class="form-label">رقم الهوية أو البريد الإلكتروني</label>
                <input type="text" id="forgotIdentifier" class="form-input" placeholder="أدخل رقم الهوية أو البريد الإلكتروني">
            </div>
            
            <div class="flex space-x-3 space-x-reverse">
                <button onclick="submitForgotPassword()" class="flex-1 bg-ksu-green text-white py-2 rounded-lg font-bold">
                    إرسال
                </button>
                <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold">
                    إلغاء
                </button>
            </div>
        </div>
    `);
}

// Submit Forgot Password
async function submitForgotPassword() {
    const identifier = document.getElementById('forgotIdentifier').value;
    
    if (!identifier || identifier.trim().length < 3) {
        Utils.showToast('يرجى إدخال رقم الهوية أو البريد الإلكتروني', 'error');
        return;
    }
    
    // Simulate API call
    Utils.showModal(`
        <div class="text-center">
            <div class="text-green-500 text-4xl mb-4">✓</div>
            <h3 class="text-lg font-bold text-green-600 mb-4">تم الإرسال بنجاح</h3>
            <p class="text-gray-600 mb-6">تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني</p>
            <button onclick="Utils.closeModal()" class="bg-ksu-green text-white px-6 py-2 rounded-lg">
                إغلاق
            </button>
        </div>
    `);
}

// Show MFA Modal (Multi-Factor Authentication)
function showMFAModal(userData) {
    Utils.showModal(`
        <div>
            <h3 class="text-lg font-bold text-ksu-green mb-4">المصادقة الثنائية</h3>
            <p class="text-gray-600 mb-4 text-sm">تم إرسال رمز التحقق إلى جوالك المسجل</p>
            <p class="text-xs text-gray-500 mb-4">الرمز التجريبي: 123456</p>
            
            <div class="mb-4">
                <label class="form-label">رمز التحقق</label>
                <input type="text" id="mfaCode" class="form-input text-center text-2xl tracking-widest" 
                    placeholder="000000" maxlength="6">
            </div>
            
            <div class="flex space-x-3 space-x-reverse">
                <button onclick="verifyMFA('${userData.nationalID}')" class="flex-1 bg-ksu-green text-white py-2 rounded-lg font-bold">
                    تحقق
                </button>
                <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold">
                    إلغاء
                </button>
            </div>
            
            <p class="text-center text-xs text-gray-500 mt-4">
                لم يصلك الرمز؟ 
                <a href="#" onclick="resendMFA()" class="text-ksu-green hover:underline">إعادة الإرسال</a>
            </p>
        </div>
    `);
    
    // Auto-focus on MFA input
    setTimeout(() => {
        document.getElementById('mfaCode')?.focus();
    }, 100);
}

// Verify MFA Code
async function verifyMFA(nationalID) {
    const mfaCode = document.getElementById('mfaCode').value;
    
    if (!mfaCode || mfaCode.length !== 6) {
        Utils.showToast('يرجى إدخال رمز التحقق المكون من 6 أرقام', 'error');
        return;
    }
    
    // Use centralized verification
    const isValid = Security.verifyMFA(nationalID);
    
    if (isValid) {
        Utils.showToast('تم تسجيل الدخول بنجاح', 'success');
        
        // Redirect to academic data form
        setTimeout(() => {
            window.location.href = 'academic-data.html';
        }, 1000);
    }
}

// Resend MFA Code
function resendMFA() {
    Security.resendMFA();
}
