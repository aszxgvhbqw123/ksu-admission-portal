// Signup Form Handler

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const nationalIDInput = document.getElementById('nationalID');
    const mobileInput = document.getElementById('mobile');

    // Real-time password validation
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        
        // Length check
        document.getElementById('lengthCheck').className = 
            password.length >= 8 ? 'text-green-500' : 'text-red-500';
        
        // Uppercase check
        document.getElementById('uppercaseCheck').className = 
            /[A-Z]/.test(password) ? 'text-green-500' : 'text-red-500';
        
        // Lowercase check
        document.getElementById('lowercaseCheck').className = 
            /[a-z]/.test(password) ? 'text-green-500' : 'text-red-500';
        
        // Number check
        document.getElementById('numberCheck').className = 
            /[0-9]/.test(password) ? 'text-green-500' : 'text-red-500';
        
        // Special character check
        document.getElementById('specialCheck').className = 
            /[@$!%*?&]/.test(password) ? 'text-green-500' : 'text-red-500';
        
        // Check password match
        if (confirmPasswordInput.value) {
            checkPasswordMatch();
        }
    });

    // Confirm password validation
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);

    function checkPasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const matchElement = document.getElementById('passwordMatch');
        
        if (confirmPassword && password !== confirmPassword) {
            matchElement.textContent = 'كلمات المرور غير متطابقة';
            matchElement.className = 'text-xs mt-2 text-red-500';
        } else if (confirmPassword && password === confirmPassword) {
            matchElement.textContent = 'كلمات المرور متطابقة ✓';
            matchElement.className = 'text-xs mt-2 text-green-500';
        } else {
            matchElement.textContent = 'كلمات المرور غير متطابقة';
            matchElement.className = 'text-xs mt-2 text-red-500';
        }
    }

    // National ID input validation
    nationalIDInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.substring(0, 10);
        e.target.value = value;
    });

    // Mobile number input validation
    mobileInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 10) value = value.substring(0, 10);
        e.target.value = value;
    });

    // Form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            fullNameArabic: document.getElementById('fullNameArabic').value,
            fullNameEnglish: document.getElementById('fullNameEnglish').value,
            nationalID: document.getElementById('nationalID').value,
            email: document.getElementById('email').value,
            mobile: document.getElementById('mobile').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            termsAccepted: document.getElementById('termsAccepted').checked
        };

        // Validate form
        const errors = FormValidator.validateSignupForm(formData);
        
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
            fullNameArabic: Utils.sanitizeInput(formData.fullNameArabic),
            fullNameEnglish: Utils.sanitizeInput(formData.fullNameEnglish),
            nationalID: Utils.sanitizeInput(formData.nationalID),
            email: Utils.sanitizeInput(formData.email),
            mobile: Utils.formatMobileNumber(formData.mobile)
        };

        // Check rate limiting
        if (!Security.rateLimiter.check()) {
            Utils.showToast('يرجى الانتظار قبل المحاولة مرة أخرى', 'warning');
            return;
        }

        // Simulate API call
        const submitButton = signupForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner inline-block"></span> جاري التسجيل...';

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Store user data with history
            DataStore.save('user_data', sanitizedData);
            
            // Try cloud sync and show result
            let cloudMsg = '';
            try {
                const saved = await CloudDB.save('user_data', sanitizedData);
                if (saved) {
                    cloudMsg = '<p class="text-ksu-green text-sm mt-2">☁️ تم الحفظ في السحابة بنجاح</p>';
                }
            } catch (e) {
                cloudMsg = '<p class="text-yellow-500 text-sm mt-2">☁️ سيتم الرفع للسحابة تلقائياً لاحقاً</p>';
            }
            
            // Show success message
            Utils.showModal(`
                <div class="text-center">
                    <div class="text-green-500 text-4xl mb-4">✓</div>
                    <h3 class="text-lg font-bold text-green-600 mb-4">تم إنشاء الحساب بنجاح</h3>
                    <p class="text-gray-600 mb-2">تم إرسال رسالة تأكيد إلى بريدك الإلكتروني</p>
                    ${cloudMsg}
                    <a href="login.html" class="mt-4 bg-ksu-green text-white px-6 py-2 rounded-lg inline-block">
                        الانتقال إلى تسجيل الدخول
                    </a>
                </div>
            `);
            
            // Reset form
            signupForm.reset();
            
        } catch (error) {
            Utils.showToast('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'إنشاء الحساب';
        }
    });
});

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}
