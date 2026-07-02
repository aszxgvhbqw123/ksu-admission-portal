// Tracks and Colleges Admission System Handler

document.addEventListener('DOMContentLoaded', () => {
    // Load academic data
    const academicData = JSON.parse(localStorage.getItem('academic_data') || '{}');
    
    // Set user name
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (userData.fullNameArabic) {
        document.getElementById('userName').textContent = `مرحباً، ${userData.fullNameArabic}`;
    }

    // Display weighted average
    if (academicData.weightedAverage) {
        document.getElementById('weightedAverageDisplay').textContent = academicData.weightedAverage;
        
        // Filter tracks based on eligibility
        filterTracksByEligibility(academicData.weightedAverage, academicData.eligibility);
    } else {
        // Redirect to academic data if no data
        Utils.showToast('يرجى إدخال البيانات الأكاديمية أولاً', 'warning');
        setTimeout(() => {
            window.location.href = 'academic-data.html';
        }, 2000);
    }

    // Initialize preferences
    AppState.formData.preferences = [];
});

// Track data
const tracksData = {
    health: {
        name: 'المسار الصحي',
        nameEn: 'Health Track',
        minPercentage: 90,
        colleges: [
            { id: 'medicine', name: 'الطب البشري', nameEn: 'Medicine', capacity: 200 },
            { id: 'dentistry', name: 'طب الأسنان', nameEn: 'Dentistry', capacity: 80 },
            { id: 'pharmacy', name: 'الصيدلة', nameEn: 'Pharmacy', capacity: 150 },
            { id: 'medical-sciences', name: 'العلوم الطبية التطبيقية', nameEn: 'Applied Medical Sciences', capacity: 300 }
        ]
    },
    engineering: {
        name: 'المسار الهندسي والعلمي',
        nameEn: 'Engineering & Science Track',
        minPercentage: 85,
        colleges: [
            { id: 'cs', name: 'علوم الحاسب', nameEn: 'Computer Science', capacity: 250 },
            { id: 'cybersecurity', name: 'الأمن السيبراني', nameEn: 'Cybersecurity', capacity: 100 },
            { id: 'civil-engineering', name: 'الهندسة المدنية', nameEn: 'Civil Engineering', capacity: 180 },
            { id: 'electrical-engineering', name: 'الهندسة الكهربائية', nameEn: 'Electrical Engineering', capacity: 200 },
            { id: 'mechanical-engineering', name: 'الهندسة الميكانيكية', nameEn: 'Mechanical Engineering', capacity: 150 }
        ]
    },
    humanities: {
        name: 'المسار الإنساني',
        nameEn: 'Humanities Track',
        minPercentage: 70,
        colleges: [
            { id: 'law', name: 'القانون', nameEn: 'Law', capacity: 300 },
            { id: 'business', name: 'إدارة الأعمال', nameEn: 'Business Administration', capacity: 400 },
            { id: 'languages', name: 'اللغات والترجمة', nameEn: 'Languages & Translation', capacity: 250 },
            { id: 'arts', name: 'الآداب والعلوم الإنسانية', nameEn: 'Arts & Humanities', capacity: 350 },
            { id: 'education', name: 'التربية', nameEn: 'Education', capacity: 300 }
        ]
    }
};

// Filter tracks based on eligibility
function filterTracksByEligibility(weightedAverage, eligibility) {
    const trackCards = document.querySelectorAll('.track-card');
    
    trackCards.forEach(card => {
        const trackType = card.dataset.track;
        const minPercentage = parseInt(card.dataset.minPercentage);
        const isEligible = weightedAverage >= minPercentage;
        
        if (!isEligible) {
            card.style.opacity = '0.5';
            card.querySelector('button').disabled = true;
            card.querySelector('button').textContent = 'غير متاح';
            card.querySelector('button').classList.add('bg-gray-400');
        }
    });
}

// Filter tracks based on user selection
function filterTracks() {
    const trackFilter = document.getElementById('trackFilter').value;
    const minPercentageFilter = parseInt(document.getElementById('minPercentageFilter').value);
    const eligibilityFilter = document.getElementById('eligibilityFilter').value;
    
    const academicData = JSON.parse(localStorage.getItem('academic_data') || '{}');
    const weightedAverage = academicData.weightedAverage || 0;
    
    const trackCards = document.querySelectorAll('.track-card');
    
    trackCards.forEach(card => {
        const trackType = card.dataset.track;
        const minPercentage = parseInt(card.dataset.minPercentage);
        const isEligible = weightedAverage >= minPercentage;
        
        let visible = true;
        
        // Track filter
        if (trackFilter !== 'all' && trackType !== trackFilter) {
            visible = false;
        }
        
        // Minimum percentage filter
        if (minPercentageFilter > 0 && minPercentage < minPercentageFilter) {
            visible = false;
        }
        
        // Eligibility filter
        if (eligibilityFilter === 'eligible' && !isEligible) {
            visible = false;
        }
        if (eligibilityFilter === 'not-eligible' && isEligible) {
            visible = false;
        }
        
        card.style.display = visible ? 'block' : 'none';
    });
}

// Reset filters
function resetFilters() {
    document.getElementById('trackFilter').value = 'all';
    document.getElementById('minPercentageFilter').value = '0';
    document.getElementById('eligibilityFilter').value = 'all';
    filterTracks();
}

// Show track details
function showTrackDetails(trackType) {
    const track = tracksData[trackType];
    const academicData = JSON.parse(localStorage.getItem('academic_data') || '{}');
    const weightedAverage = academicData.weightedAverage || 0;
    const isEligible = weightedAverage >= track.minPercentage;
    
    let collegesHTML = track.colleges.map(college => `
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
            <div>
                                <p class="font-medium">${college.name}</p>
                                <p class="text-xs text-gray-500">${college.nameEn}</p>
                            </div>
                            <div class="flex items-center space-x-2 space-x-reverse">
                                <span class="badge ${isEligible ? 'badge-success' : 'badge-danger'}">
                                    ${isEligible ? 'متاح' : 'غير متاح'}
                                </span>
                                ${isEligible ? `
                                    <button onclick="addToPreferences('${trackType}', '${college.id}', '${college.name}')" 
                                        class="bg-ksu-green text-white px-3 py-1 rounded text-sm hover:bg-ksu-dark-green">
                                        إضافة للرغبات
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('');
    
    Utils.showModal(`
        <div class="max-h-96 overflow-y-auto">
            <h3 class="text-lg font-bold text-ksu-green mb-4">${track.name}</h3>
            <p class="text-gray-600 mb-4">${track.nameEn}</p>
            
            <div class="mb-4">
                <span class="badge ${isEligible ? 'badge-success' : 'badge-danger'}">
                    ${isEligible ? '✓ مؤهل' : '✗ غير مؤهل'}
                </span>
                <span class="badge badge-info ml-2">الحد الأدنى: ${track.minPercentage}%</span>
                <span class="badge badge-warning ml-2">نسبتك: ${weightedAverage}%</span>
            </div>
            
            <h4 class="font-bold mb-3">التخصصات المتاحة:</h4>
            ${collegesHTML}
            
            <button onclick="Utils.closeModal()" class="w-full mt-4 bg-gray-200 text-gray-800 py-2 rounded-lg">
                إغلاق
            </button>
        </div>
    `);
}

// Add to preferences
function addToPreferences(trackType, collegeId, collegeName) {
    if (AppState.formData.preferences.length >= 5) {
        Utils.showToast('يمكنك اختيار 5 تخصصات كحد أقصى', 'warning');
        return;
    }
    
    // Check if already added
    const exists = AppState.formData.preferences.find(p => p.collegeId === collegeId);
    if (exists) {
        Utils.showToast('تم إضافة هذا التخصص بالفعل', 'warning');
        return;
    }
    
    AppState.formData.preferences.push({
        trackType,
        collegeId,
        collegeName,
        order: AppState.formData.preferences.length + 1
    });
    
    updatePreferencesList();
    Utils.showToast(`تم إضافة ${collegeName} إلى الرغبات`, 'success');
    
    // Enable submit button if at least one preference
    document.getElementById('submitPreferencesBtn').disabled = AppState.formData.preferences.length === 0;
}

// Update preferences list
function updatePreferencesList() {
    const listContainer = document.getElementById('preferencesList');
    
    if (AppState.formData.preferences.length === 0) {
        listContainer.innerHTML = `
            <div class="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 text-center text-gray-400">
                <p>لم يتم اختيار أي تخصص بعد</p>
                <p class="text-sm">اضغط على "إضافة للرغبات" من التخصصات أعلاه</p>
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = AppState.formData.preferences.map((pref, index) => `
        <div class="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm" 
             draggable="true" data-index="${index}">
            <div class="flex items-center space-x-3 space-x-reverse">
                <span class="drag-handle text-xl">⋮⋮</span>
                <span class="bg-ksu-green text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    ${index + 1}
                </span>
                <div>
                    <p class="font-medium">${pref.collegeName}</p>
                    <p class="text-xs text-gray-500">${tracksData[pref.trackType].name}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2 space-x-reverse">
                <button onclick="movePreference(${index}, -1)" class="text-gray-400 hover:text-ksu-green ${index === 0 ? 'invisible' : ''}">
                    ▲
                </button>
                <button onclick="movePreference(${index}, 1)" class="text-gray-400 hover:text-ksu-green ${index === AppState.formData.preferences.length - 1 ? 'invisible' : ''}">
                    ▼
                </button>
                <button onclick="removePreference(${index})" class="text-red-500 hover:text-red-700">
                    ✕
                </button>
            </div>
        </div>
    `).join('');
}

// Move preference up/down
function movePreference(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= AppState.formData.preferences.length) return;
    
    const temp = AppState.formData.preferences[index];
    AppState.formData.preferences[index] = AppState.formData.preferences[newIndex];
    AppState.formData.preferences[newIndex] = temp;
    
    // Update order
    AppState.formData.preferences.forEach((pref, i) => {
        pref.order = i + 1;
    });
    
    updatePreferencesList();
}

// Remove preference
function removePreference(index) {
    const removed = AppState.formData.preferences.splice(index, 1)[0];
    
    // Update order
    AppState.formData.preferences.forEach((pref, i) => {
        pref.order = i + 1;
    });
    
    updatePreferencesList();
    Utils.showToast(`تم إزالة ${removed.collegeName} من الرغبات`, 'success');
    
    // Disable submit button if no preferences
    document.getElementById('submitPreferencesBtn').disabled = AppState.formData.preferences.length === 0;
}

// Submit preferences
function submitPreferences() {
    if (AppState.formData.preferences.length === 0) {
        Utils.showToast('يرجى اختيار تخصص واحد على الأقل', 'warning');
        return;
    }
    
    // Store preferences with history
    DataStore.save('preferences', AppState.formData.preferences);
    
    // Show confirmation
    const preferencesList = AppState.formData.preferences.map((pref, index) => 
        `<p class="text-sm">${index + 1}. ${pref.collegeName} (${tracksData[pref.trackType].name})</p>`
    ).join('');
    
    Utils.showModal(`
        <div class="text-center">
            <div class="text-green-500 text-4xl mb-4">✓</div>
            <h3 class="text-lg font-bold text-green-600 mb-4">تم حفظ الرغبات بنجاح</h3>
            <div class="bg-gray-50 p-4 rounded-lg mb-4 text-right">
                <p class="font-bold mb-2">رغباتك:</p>
                ${preferencesList}
            </div>
            <p class="text-gray-600 mb-6">يمكنك الآن عرض الرسوم وإتمام عملية الدفع</p>
            <a href="fees.html" class="bg-ksu-green text-white px-6 py-2 rounded-lg inline-block">
                التالي: عرض الرسوم
            </a>
        </div>
    `);
}
