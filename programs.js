// KSU Programs Page JavaScript

// Filter programs based on selected criteria
function filterPrograms() {
    const trackFilter = document.getElementById('trackFilter').value;
    const periodFilter = document.getElementById('periodFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;
    
    const programCards = document.querySelectorAll('.program-card');
    
    programCards.forEach(card => {
        const track = card.dataset.track;
        const period = card.dataset.period;
        const price = parseInt(card.dataset.price);
        
        let showCard = true;
        
        // Track filter
        if (trackFilter !== 'all' && track !== trackFilter) {
            showCard = false;
        }
        
        // Period filter
        if (periodFilter !== 'all' && period !== periodFilter) {
            showCard = false;
        }
        
        // Price filter
        if (priceFilter !== 'all') {
            if (priceFilter === 'low' && price >= 5000) showCard = false;
            if (priceFilter === 'medium' && (price < 5000 || price > 10000)) showCard = false;
            if (priceFilter === 'high' && price <= 10000) showCard = false;
        }
        
        card.style.display = showCard ? 'block' : 'none';
    });
    
    // Update visible count
    const visibleCount = Array.from(programCards).filter(card => card.style.display !== 'none').length;
    Utils.showToast(`عرض ${visibleCount} برنامج`, 'info');
}

// Reset all filters
function resetFilters() {
    document.getElementById('trackFilter').value = 'all';
    document.getElementById('periodFilter').value = 'all';
    document.getElementById('priceFilter').value = 'all';
    
    const programCards = document.querySelectorAll('.program-card');
    programCards.forEach(card => {
        card.style.display = 'block';
    });
    
    Utils.showToast('تم إعادة تعيين الفلاتر', 'success');
}

// Register for a program
function registerProgram(programName) {
    // Check if user is logged in
    const userData = localStorage.getItem('ksu_user_data');
    
    if (!userData) {
        Utils.showToast('يرجى تسجيل الدخول أولاً', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Save selected program
    localStorage.setItem('selected_program', programName);
    
    // Show confirmation modal
    const modalContent = `
        <div class="text-center">
            <div class="w-16 h-16 bg-ksu-emerald bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-ksu-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 class="text-xl font-bold text-ksu-dark mb-2">تأكيد التسجيل</h3>
            <p class="text-gray-600 mb-4">هل تريد التسجيل في برنامج: <strong>${programName}</strong>؟</p>
            <div class="flex space-x-3 space-x-reverse justify-center">
                <button onclick="confirmRegistration('${programName}')" class="bg-ksu-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-ksu-dark transition">
                    نعم، تابع
                </button>
                <button onclick="Utils.closeModal()" class="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition">
                    إلغاء
                </button>
            </div>
        </div>
    `;
    
    Utils.showModal(modalContent);
}

// Confirm registration
function confirmRegistration(programName) {
    Utils.closeModal();
    
    // Show loading state
    Utils.showToast('جاري معالجة الطلب...', 'info');
    
    // Simulate API call
    setTimeout(() => {
        // Generate mock payment token
        const paymentToken = 'tok_sub_les_' + Math.random().toString(36).substr(2, 9);
        
        // Save registration data
        const registrationData = {
            program: programName,
            paymentToken: paymentToken,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('registration_data', JSON.stringify(registrationData));
        
        // Redirect to payment page
        window.location.href = 'payment.html';
    }, 1500);
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing user data
    const userData = localStorage.getItem('ksu_user_data');
    if (userData) {
        const user = JSON.parse(userData);
        console.log('Welcome back:', user.fullNameArabic);
    }
    
    // Initialize filters
    filterPrograms();
    
    console.log('KSU Programs page initialized');
});
