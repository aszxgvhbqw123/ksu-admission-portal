document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const preferences = JSON.parse(localStorage.getItem('preferences') || '[]');
    
    if (userData.fullNameArabic) {
        document.getElementById('userName').textContent = `مرحباً، ${userData.fullNameArabic}`;
        document.getElementById('studentName').textContent = userData.fullNameArabic;
    }
    
    const orderNumber = 'KSU-2026-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    document.getElementById('orderNumber').textContent = orderNumber;
    
    const today = new Date();
    document.getElementById('invoiceDate').textContent = today.toLocaleDateString('ar-SA');
    
    calculateFees(preferences);
});

const feeStructure = {
    applicationFee: 200,
    processingFee: 0
};

const collegeFees = {
    'الطب البشري': { saudi: 25000, nonSaudi: 150000, diploma: null },
    'طب الأسنان': { saudi: 20000, nonSaudi: 120000, diploma: null },
    'الصيدلة': { saudi: 15000, nonSaudi: 100000, diploma: null },
    'العلوم الطبية التطبيقية': { saudi: 12000, nonSaudi: 80000, diploma: 45000 },
    'علوم الحاسب': { saudi: 10000, nonSaudi: 70000, diploma: 35000 },
    'الأمن السيبراني': { saudi: 12000, nonSaudi: 75000, diploma: 40000 },
    'الهندسة المدنية': { saudi: 8000, nonSaudi: 65000, diploma: 32000 },
    'الهندسة الكهربائية': { saudi: 8000, nonSaudi: 65000, diploma: 32000 },
    'الهندسة الميكانيكية': { saudi: 8000, nonSaudi: 65000, diploma: 32000 },
    'القانون': { saudi: 7000, nonSaudi: 50000, diploma: 25000 },
    'إدارة الأعمال': { saudi: 8000, nonSaudi: 55000, diploma: 28000 },
    'اللغات والترجمة': { saudi: 5000, nonSaudi: 45000, diploma: 22000 },
    'الآداب والعلوم الإنسانية': { saudi: 4000, nonSaudi: 40000, diploma: 20000 },
    'التربية': { saudi: 4000, nonSaudi: 40000, diploma: 20000 }
};

function calculateFees(preferences) {
    const preferencesFeesContainer = document.getElementById('preferencesFees');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const nationality = userData.nationality || 'saudi';
    const isSaudi = nationality === 'saudi';
    let totalFees = feeStructure.applicationFee;
    
    if (preferences.length === 0) {
        preferencesFeesContainer.innerHTML = `
            <div class="p-3 bg-yellow-50 rounded-xl text-yellow-800 text-sm">
                لم يتم اختيار أي تخصص بعد
            </div>
        `;
    } else {
        preferencesFeesContainer.innerHTML = preferences.map((pref, index) => {
            const fees = collegeFees[pref.collegeName] || { saudi: 0, nonSaudi: 0, diploma: null };
            const feeAmount = isSaudi ? fees.saudi : fees.nonSaudi;
            totalFees += feeAmount;
            return `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                        <p class="font-medium">${pref.collegeName}</p>
                        <p class="text-xs text-gray-500">الرغبة ${index + 1}</p>
                    </div>
                    <span class="text-ksu-green font-bold">${feeAmount.toLocaleString('ar-SA')} ر.س</span>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('totalAmount').textContent = `${totalFees.toLocaleString('ar-SA')} ر.س`;
    
    AppState.formData.payment.totalAmount = totalFees;
    AppState.formData.payment.orderNumber = document.getElementById('orderNumber').textContent;
    DataStore.save('payment_data', AppState.formData.payment);
    if (typeof CloudDB !== 'undefined') CloudDB.save('payment_data', AppState.formData.payment).catch(() => {});
}

function proceedToPayment() {
    const preferences = JSON.parse(localStorage.getItem('preferences') || '[]');
    
    if (preferences.length === 0) {
        Utils.showToast('يرجى اختيار تخصص واحد على الأقل قبل الدفع', 'warning');
        return;
    }
    
    const totalAmount = AppState.formData.payment.totalAmount || 200;
    
    Utils.showModal(`
        <div class="text-center">
            <div class="text-ksu-green text-4xl mb-4">
                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
            </div>
            <h3 class="text-lg font-bold text-ksu-green mb-4">تأكيد الدفع</h3>
            <div class="bg-gray-50 p-4 rounded-xl mb-4">
                <p class="text-gray-600 mb-2">المبلغ المطلوب:</p>
                <p class="text-2xl font-bold text-ksu-green">${totalAmount.toLocaleString('ar-SA')} ر.س</p>
            </div>
            <p class="text-gray-500 mb-6 text-sm">سيتم توجيهك إلى بوابة الدفع الآمن</p>
            <div class="flex space-x-3 space-x-reverse">
                <button onclick="confirmPayment()" class="flex-1 bg-ksu-green text-white py-2 rounded-xl font-bold hover:bg-ksu-dark-green transition">
                    متابعة
                </button>
                <button onclick="Utils.closeModal()" class="flex-1 bg-gray-200 text-gray-800 py-2 rounded-xl font-bold hover:bg-gray-300 transition">
                    إلغاء
                </button>
            </div>
        </div>
    `);
}

function confirmPayment() {
    Utils.closeModal();
    window.location.href = 'payment.html';
}
