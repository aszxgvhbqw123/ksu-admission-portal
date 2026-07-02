// Receipt Page Handler

document.addEventListener('DOMContentLoaded', () => {
    // Load all stored data
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const academicData = JSON.parse(localStorage.getItem('academic_data') || '{}');
    const preferences = JSON.parse(localStorage.getItem('preferences') || '[]');
    const paymentData = JSON.parse(localStorage.getItem('payment_data') || '{}');
    
    // Check if payment was completed
    if (!paymentData.status || paymentData.status !== 'completed') {
        Utils.showToast('لم تكتمل عملية الدفع. يرجى العودة وإتمام الدفع', 'warning');
        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 3000);
        return;
    }
    
    // Populate receipt data
    populateReceipt(userData, academicData, preferences, paymentData);
});

// Populate receipt with data
function populateReceipt(userData, academicData, preferences, paymentData) {
    // Receipt number
    const receiptNumber = 'REC-' + Date.now();
    document.getElementById('receiptNumber').textContent = receiptNumber;
    
    // Student information
    document.getElementById('studentName').textContent = userData.fullNameArabic || '--';
    document.getElementById('studentID').textContent = userData.nationalID ? userData.nationalID.substring(0, 4) + '******' + userData.nationalID.slice(-4) : '--';
    document.getElementById('studentEmail').textContent = userData.email || '--';
    document.getElementById('studentMobile').textContent = userData.mobile ? Utils.formatMobileNumber(userData.mobile) : '--';
    
    // Payment information
    document.getElementById('transactionId').textContent = paymentData.transactionId || '--';
    document.getElementById('paymentDate').textContent = paymentData.timestamp ? new Date(paymentData.timestamp).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA');
    document.getElementById('paymentMethod').textContent = getPaymentMethodName(paymentData.paymentMethod) || '--';
    
    // Academic summary
    document.getElementById('gpa').textContent = academicData.highSchoolGPA ? academicData.highSchoolGPA + '%' : '--';
    document.getElementById('qudurat').textContent = academicData.quduratScore ? academicData.quduratScore + '%' : '--';
    document.getElementById('tahsili').textContent = academicData.tahsiliScore ? academicData.tahsiliScore + '%' : '--';
    document.getElementById('weightedAverage').textContent = academicData.weightedAverage ? academicData.weightedAverage + '%' : '--';
    
    // Preferences
    const preferencesList = document.getElementById('preferencesList');
    if (preferences.length === 0) {
        preferencesList.innerHTML = '<p class="text-gray-500">لا توجد رغبات مسجلة</p>';
    } else {
        preferencesList.innerHTML = preferences.map((pref, index) => `
            <div class="flex justify-between items-center p-2 bg-white rounded border border-gray-200">
                <div class="flex items-center space-x-3 space-x-reverse">
                    <span class="bg-ksu-green text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        ${index + 1}
                    </span>
                    <span class="font-medium">${pref.collegeName}</span>
                </div>
                <span class="text-xs text-gray-500">${tracksData[pref.trackType]?.name || ''}</span>
            </div>
        `).join('');
    }
    
    // Total amount
    document.getElementById('totalAmount').textContent = paymentData.totalAmount ? `${paymentData.totalAmount.toLocaleString('ar-SA')} ر.س` : '0 ر.س';
    
    // Set user name in nav
    if (userData.fullNameArabic) {
        document.getElementById('userName').textContent = `مرحباً، ${userData.fullNameArabic}`;
    }
}

// Track data reference
const tracksData = {
    health: { name: 'المسار الصحي' },
    engineering: { name: 'المسار الهندسي والعلمي' },
    humanities: { name: 'المسار الإنساني' }
};

// Get payment method name in Arabic
function getPaymentMethodName(method) {
    const names = {
        'mada': 'مدى (Mada)',
        'visa': 'Visa / MasterCard',
        'applepay': 'Apple Pay'
    };
    return names[method] || method;
}

// Print receipt
function printReceipt() {
    window.print();
}

// Download receipt as PDF (placeholder - would require a PDF library)
function downloadReceipt() {
    Utils.showToast('جاري تحميل الإيصال...', 'info');
    
    // In a real implementation, this would use a library like jsPDF or html2pdf
    // For now, we'll create a simple text download
    const receiptContent = generateReceiptText();
    
    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KSU_Receipt_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    Utils.showToast('تم تحميل الإيصال', 'success');
}

// Generate receipt text content
function generateReceiptText() {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const academicData = JSON.parse(localStorage.getItem('academic_data') || '{}');
    const preferences = JSON.parse(localStorage.getItem('preferences') || '[]');
    const paymentData = JSON.parse(localStorage.getItem('payment_data') || '{}');
    
    let content = `
========================================
إيصال دفع - جامعة الملك سعود
King Saud University - Payment Receipt
========================================

رقم الإيصال: REC-${Date.now()}
تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}

----------------------------------------
معلومات الطالب
----------------------------------------
الاسم: ${userData.fullNameArabic || '--'}
رقم الهوية: ${userData.nationalID ? userData.nationalID.substring(0, 4) + '******' + userData.nationalID.slice(-4) : '--'}
البريد الإلكتروني: ${userData.email || '--'}
رقم الجوال: ${userData.mobile || '--'}

----------------------------------------
معلومات الدفع
----------------------------------------
رقم المعاملة: ${paymentData.transactionId || '--'}
تاريخ الدفع: ${paymentData.timestamp ? new Date(paymentData.timestamp).toLocaleDateString('ar-SA') : '--'}
طريقة الدفع: ${getPaymentMethodName(paymentData.paymentMethod) || '--'}
الحالة: مكتمل ✓
المبلغ: ${paymentData.totalAmount ? paymentData.totalAmount.toLocaleString('ar-SA') + ' ر.س' : '0 ر.س'}

----------------------------------------
الملخص الأكاديمي
----------------------------------------
المعدل الثانوي: ${academicData.highSchoolGPA ? academicData.highSchoolGPA + '%' : '--'}
درجة القدرات: ${academicData.quduratScore ? academicData.quduratScore + '%' : '--'}
درجة التحصيلي: ${academicData.tahsiliScore ? academicData.tahsiliScore + '%' : '--'}
النسبة الموزونة: ${academicData.weightedAverage ? academicData.weightedAverage + '%' : '--'}

----------------------------------------
الرغبات المسجلة
----------------------------------------
${preferences.map((pref, index) => `${index + 1}. ${pref.collegeName} (${tracksData[pref.trackType]?.name || ''})`).join('\n')}

========================================
جميع الحقوق محفوظة © 2026
جامعة الملك سعود
========================================
`;
    
    return content;
}
