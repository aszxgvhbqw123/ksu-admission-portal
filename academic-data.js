// Academic Data Form Handler with Weighted Average Calculation

document.addEventListener('DOMContentLoaded', () => {
    const academicForm = document.getElementById('academicForm');
    const highSchoolGPA = document.getElementById('highSchoolGPA');
    const quduratScore = document.getElementById('quduratScore');
    const tahsiliScore = document.getElementById('tahsiliScore');

    // Set user name from localStorage
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    if (userData.fullNameArabic) {
        document.getElementById('userName').textContent = `مرحباً، ${userData.fullNameArabic}`;
    }

    // Real-time weighted average calculation
    function calculateWeightedAverage() {
        const gpa = parseFloat(highSchoolGPA.value) || 0;
        const qudurat = parseFloat(quduratScore.value) || 0;
        const tahsili = parseFloat(tahsiliScore.value) || 0;

        // Calculate weighted components
        const gpaWeighted = (gpa * 0.40).toFixed(2);
        const quduratWeighted = (qudurat * 0.30).toFixed(2);
        const tahsiliWeighted = (tahsili * 0.30).toFixed(2);

        // Calculate final weighted average
        const weightedAverage = WeightedAverageCalculator.calculate(gpa, qudurat, tahsili);

        // Update display
        document.getElementById('gpaDisplay').textContent = gpa > 0 ? gpaWeighted : '--';
        document.getElementById('quduratDisplay').textContent = qudurat > 0 ? quduratWeighted : '--';
        document.getElementById('tahsiliDisplay').textContent = tahsili > 0 ? tahsiliWeighted : '--';
        document.getElementById('weightedAverageDisplay').textContent = weightedAverage > 0 ? weightedAverage : '--';

        return weightedAverage;
    }

    // Add event listeners for real-time calculation
    highSchoolGPA.addEventListener('input', calculateWeightedAverage);
    quduratScore.addEventListener('input', calculateWeightedAverage);
    tahsiliScore.addEventListener('input', calculateWeightedAverage);

    // Form submission
    academicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            gender: document.getElementById('gender').value,
            birthDate: document.getElementById('birthDate').value,
            city: document.getElementById('city').value,
            maritalStatus: document.getElementById('maritalStatus').value,
            graduationYear: document.getElementById('graduationYear').value,
            highSchoolType: document.getElementById('highSchoolType').value,
            highSchoolGPA: document.getElementById('highSchoolGPA').value,
            quduratScore: document.getElementById('quduratScore').value,
            tahsiliScore: document.getElementById('tahsiliScore').value,
            highSchoolName: document.getElementById('highSchoolName').value
        };

        // Validate form
        const errors = FormValidator.validateAcademicForm(formData);
        
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

        // Calculate weighted average
        const weightedAverage = calculateWeightedAverage();
        
        // Get eligibility
        const eligibility = WeightedAverageCalculator.getEligibility(weightedAverage);

        // Sanitize data
        const sanitizedData = {
            gender: Utils.sanitizeInput(formData.gender),
            birthDate: Utils.sanitizeInput(formData.birthDate),
            city: Utils.sanitizeInput(formData.city),
            maritalStatus: Utils.sanitizeInput(formData.maritalStatus),
            graduationYear: Utils.sanitizeInput(formData.graduationYear),
            highSchoolType: Utils.sanitizeInput(formData.highSchoolType),
            highSchoolGPA: parseFloat(formData.highSchoolGPA),
            quduratScore: parseFloat(formData.quduratScore),
            tahsiliScore: parseFloat(formData.tahsiliScore),
            highSchoolName: Utils.sanitizeInput(formData.highSchoolName),
            weightedAverage: weightedAverage,
            eligibility: eligibility
        };

        AppState.formData.academic = sanitizedData;
        DataStore.save('academic_data', sanitizedData);
        if (typeof CloudDB !== 'undefined') {
            try { await CloudDB.save('academic_data', sanitizedData); } catch (e) {
                console.warn('[Academic] Cloud save failed:', e.message);
            }
        }

        // Show success message with eligibility info
        let eligibilityMessage = '';
        if (eligibility.health) {
            eligibilityMessage += '<p class="text-green-600">✓ مؤهل للمسار الصحي</p>';
        }
        if (eligibility.engineering) {
            eligibilityMessage += '<p class="text-green-600">✓ مؤهل للمسار الهندسي</p>';
        }
        if (eligibility.science) {
            eligibilityMessage += '<p class="text-green-600">✓ مؤهل للمسار العلمي</p>';
        }
        if (eligibility.humanities) {
            eligibilityMessage += '<p class="text-green-600">✓ مؤهل للمسار الإنساني</p>';
        }

        Utils.showModal(`
            <div class="text-center">
                <div class="text-green-500 text-4xl mb-4">✓</div>
                <h3 class="text-lg font-bold text-green-600 mb-4">تم حفظ البيانات بنجاح</h3>
                <div class="bg-ksu-gold rounded-lg p-4 mb-4">
                    <p class="text-ksu-green font-bold text-xl mb-2">نسبتك الموزونة: ${weightedAverage}%</p>
                    <div class="text-right text-sm space-y-1">
                        ${eligibilityMessage}
                    </div>
                </div>
                <p class="text-gray-600 mb-6">يمكنك الآن اختيار التخصصات المتاحة</p>
                <a href="tracks.html" class="bg-ksu-green text-white px-6 py-2 rounded-lg inline-block">
                    التالي: اختيار التخصص
                </a>
            </div>
        `);
    });

    // Set max date for birth date (must be at least 16 years old)
    const birthDateInput = document.getElementById('birthDate');
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 16);
    birthDateInput.max = maxDate.toISOString().split('T')[0];
});
