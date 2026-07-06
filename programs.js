const diplomaPrograms = [
    { name: 'الأمن السيبراني الطبي', track: 'health', period: 'evening', price: 45000, desc: '4 فصول دراسية', semesterFee: 4500 },
    { name: 'إدارة المستشفيات', track: 'health', period: 'distance', price: 42000, desc: '4 فصول دراسية', semesterFee: 4200 },
    { name: 'التقنية الصحية', track: 'health', period: 'evening', price: 48000, desc: '4 فصول دراسية', semesterFee: 4800 },
    { name: 'الأشعة التشخيصية', track: 'health', period: 'evening', price: 46000, desc: '4 فصول دراسية', semesterFee: 4600 },
    { name: 'التمريض العام', track: 'health', period: 'evening', price: 44000, desc: '4 فصول دراسية', semesterFee: 4400 },
    { name: 'الأمن السيبراني', track: 'engineering', period: 'evening', price: 40000, desc: '4 فصول دراسية', semesterFee: 4000 },
    { name: 'علوم الحاسب', track: 'engineering', period: 'distance', price: 35000, desc: '4 فصول دراسية', semesterFee: 3500 },
    { name: 'الشبكات والاتصالات', track: 'engineering', period: 'weekend', price: 38000, desc: '4 فصول دراسية', semesterFee: 3800 },
    { name: 'هندسة البرمجيات', track: 'engineering', period: 'distance', price: 36000, desc: '4 فصول دراسية', semesterFee: 3600 },
    { name: 'الذكاء الاصطناعي', track: 'engineering', period: 'evening', price: 42000, desc: '4 فصول دراسية', semesterFee: 4200 },
    { name: 'أنظمة المعلومات', track: 'engineering', period: 'weekend', price: 34000, desc: '4 فصول دراسية', semesterFee: 3400 },
    { name: 'إدارة البيانات وتحليلها', track: 'engineering', period: 'distance', price: 37000, desc: '4 فصول دراسية', semesterFee: 3700 },
    { name: 'إدارة الأعمال', track: 'business', period: 'evening', price: 28000, desc: '4 فصول دراسية', semesterFee: 2800 },
    { name: 'المحاسبة والمراجعة', track: 'business', period: 'distance', price: 25000, desc: '4 فصول دراسية', semesterFee: 2500 },
    { name: 'التسويق الرقمي', track: 'business', period: 'weekend', price: 30000, desc: '4 فصول دراسية', semesterFee: 3000 },
    { name: 'الموارد البشرية', track: 'business', period: 'distance', price: 27000, desc: '4 فصول دراسية', semesterFee: 2700 },
    { name: 'إدارة المشاريع', track: 'business', period: 'evening', price: 29000, desc: '4 فصول دراسية', semesterFee: 2900 },
    { name: 'إدارة اللوجستيات وسلاسل الإمداد', track: 'business', period: 'weekend', price: 31000, desc: '4 فصول دراسية', semesterFee: 3100 },
    { name: 'المالية والاستثمار', track: 'business', period: 'evening', price: 32000, desc: '4 فصول دراسية', semesterFee: 3200 },
    { name: 'اللغات والترجمة', track: 'humanities', period: 'evening', price: 22000, desc: '4 فصول دراسية', semesterFee: 2200 },
    { name: 'القانون', track: 'humanities', period: 'distance', price: 20000, desc: '4 فصول دراسية', semesterFee: 2000 },
    { name: 'الإعلام الرقمي', track: 'humanities', period: 'weekend', price: 24000, desc: '4 فصول دراسية', semesterFee: 2400 },
    { name: 'علم النفس التطبيقي', track: 'humanities', period: 'distance', price: 21000, desc: '4 فصول دراسية', semesterFee: 2100 },
    { name: 'التربية الخاصة', track: 'humanities', period: 'evening', price: 20000, desc: '4 فصول دراسية', semesterFee: 2000 },
    { name: 'التاريخ والحضارة الإسلامية', track: 'humanities', period: 'distance', price: 18000, desc: '4 فصول دراسية', semesterFee: 1800 },
    { name: 'الإرشاد النفسي', track: 'humanities', period: 'weekend', price: 23000, desc: '4 فصول دراسية', semesterFee: 2300 }
];

const trackLabels = { health: 'المسار الصحي', engineering: 'المسار الهندسي', business: 'المسار الإداري', humanities: 'المسار الإنساني' };
const periodLabels = { evening: 'مسائي', distance: 'عن بُعد', weekend: 'عطلة نهاية الأسبوع' };

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
        if (trackFilter !== 'all' && track !== trackFilter) showCard = false;
        if (periodFilter !== 'all' && period !== periodFilter) showCard = false;
        if (priceFilter !== 'all') {
            if (priceFilter === 'low' && price >= 5000) showCard = false;
            if (priceFilter === 'medium' && (price < 5000 || price > 10000)) showCard = false;
            if (priceFilter === 'high' && price <= 10000) showCard = false;
        }
        card.style.display = showCard ? 'block' : 'none';
    });
    const visibleCount = Array.from(programCards).filter(card => card.style.display !== 'none').length;
    Utils.showToast(`عرض ${visibleCount} برنامج`, 'info');
}

function resetFilters() {
    document.getElementById('trackFilter').value = 'all';
    document.getElementById('periodFilter').value = 'all';
    document.getElementById('priceFilter').value = 'all';
    const programCards = document.querySelectorAll('.program-card');
    programCards.forEach(card => { card.style.display = 'block'; });
    Utils.showToast('تم إعادة تعيين الفلاتر', 'success');
}

function registerProgram(programName) {
    const userData = localStorage.getItem('ksu_user_data');
    if (!userData) {
        Utils.showToast('يرجى تسجيل الدخول أولاً', 'warning');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }
    localStorage.setItem('selected_program', programName);
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
                <button onclick="confirmRegistration('${programName}')" class="bg-ksu-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-ksu-dark transition">نعم، تابع</button>
                <button onclick="Utils.closeModal()" class="bg-gray-100 text-gray-700 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition">إلغاء</button>
            </div>
        </div>`;
    Utils.showModal(modalContent);
}

function confirmRegistration(programName) {
    Utils.closeModal();
    Utils.showToast('جاري معالجة الطلب...', 'info');
    setTimeout(() => {
        const paymentToken = 'tok_sub_ksu_' + Math.random().toString(36).substr(2, 9);
        const registrationData = { program: programName, paymentToken: paymentToken, status: 'pending', timestamp: new Date().toISOString() };
        localStorage.setItem('registration_data', JSON.stringify(registrationData));
        window.location.href = 'payment.html';
    }, 1500);
}

function generateDynamicCards() {
    const grid = document.getElementById('programsGrid');
    if (!grid) return;
    const existingNames = new Set();
    document.querySelectorAll('.program-card').forEach(card => {
        const btn = card.querySelector('button');
        if (btn && btn.getAttribute('onclick')) {
            const match = btn.getAttribute('onclick').match(/registerProgram\('(.+?)'\)/);
            if (match) existingNames.add(match[1]);
        }
    });
    const newPrograms = diplomaPrograms.filter(p => !existingNames.has(p.name));
    newPrograms.forEach(p => {
        const div = document.createElement('div');
        div.className = 'program-card';
        div.dataset.track = p.track;
        div.dataset.period = p.period;
        div.dataset.price = p.price;
        div.innerHTML = `
            <div class="card overflow-hidden hover:shadow-xl transition duration-300">
                <div class="bg-gradient-to-l from-ksu-primary to-ksu-dark p-4 text-white">
                    <span class="badge bg-white bg-opacity-20 text-white mb-2 inline-block">${trackLabels[p.track] || p.track}</span>
                    <h3 class="text-xl font-bold">الدبلوم في ${p.name}</h3>
                </div>
                <div class="p-6">
                    <div class="space-y-3 mb-4">
                        <div class="flex items-center text-gray-600">
                            <svg class="w-5 h-5 ml-2 text-ksu-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>الفترة: ${periodLabels[p.period] || p.period}</span>
                        </div>
                        <div class="flex items-center text-gray-600">
                            <svg class="w-5 h-5 ml-2 text-ksu-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            <span>المدة: ${p.desc}</span>
                        </div>
                        <div class="flex items-center text-gray-600">
                            <svg class="w-5 h-5 ml-2 text-ksu-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span>القسط الفصلي: <strong>${p.semesterFee.toLocaleString('ar-SA')} ر.س</strong></span>
                        </div>
                    </div>
                    <div class="border-t pt-4 mt-4">
                        <p class="text-3xl font-bold text-ksu-primary mb-4">${p.price.toLocaleString('ar-SA')} ريال</p>
                        <button onclick="registerProgram('${p.name}')" class="w-full bg-gradient-to-l from-ksu-primary to-ksu-dark text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-ksu-primary/30 transition">سجل واشترك الآن</button>
                    </div>
                </div>
            </div>`;
        grid.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    generateDynamicCards();
    const userData = localStorage.getItem('ksu_user_data');
    if (userData) {
        const user = JSON.parse(userData);
        console.log('Welcome back:', user.fullNameArabic);
    }
    filterPrograms();
    console.log(`KSU Programs page initialized with ${diplomaPrograms.length} diplomas`);
});
