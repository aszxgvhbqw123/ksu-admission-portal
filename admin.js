// Admin Dashboard - Real Data Management
const AdminEngine = {
    tabs: ['dashboard', 'students', 'payments', 'fees', 'settings'],
    activeTab: 'dashboard',

    // Load all data from localStorage (with history)
    loadAllData() {
        return {
            allUsers: DataStore.getHistory('user_data'),
            allPayments: DataStore.getHistory('payment_data'),
            allPreferences: DataStore.getHistory('preferences'),
            allAcademic: DataStore.getHistory('academic_data'),
            users: JSON.parse(localStorage.getItem('users') || '[]'),
            payments: DataStore.getCurrent('payment_data') || {},
            preferences: DataStore.getCurrent('preferences') || [],
            academic: DataStore.getCurrent('academic_data') || {},
            userData: DataStore.getCurrent('user_data') || {},
            feeStructure: JSON.parse(localStorage.getItem('fee_structure') || 'null') || this.defaultFeeStructure()
        };
    },

    defaultFeeStructure() {
        return {
            applicationFee: 200,
            colleges: {
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
            }
        };
    },

    // Collect all registered users from history + current
    collectUsers() {
        const userMap = new Map();
        // Load all historical users
        const allUsers = DataStore.getHistory('user_data');
        allUsers.forEach((u, i) => {
            const ud = u.data || u;
            if (ud.fullNameArabic || ud.nationalID) {
                userMap.set(`all_user_data_${i}`, { ...ud, source: 'all_user_data' });
            }
        });
        // Also load current user_data (duplicate check by nationalID)
        const userData = DataStore.getCurrent('user_data');
        if (userData && (userData.fullNameArabic || userData.nationalID)) {
            const exists = Array.from(userMap.values()).some(u => u.nationalID === userData.nationalID);
            if (!exists) userMap.set('user_data', { ...userData, source: 'user_data' });
        }
        // Load from users array (admin-added)
        const usersArr = JSON.parse(localStorage.getItem('users') || '[]');
        usersArr.forEach((u, i) => {
            userMap.set(`users_${i}`, { ...u, source: 'users' });
        });
        return Array.from(userMap.values());
    },

    init() {
        this.lastUpdated = new Date();
        this.refresh();
        document.getElementById('lastUpdated').textContent = `آخر تحديث: ${this.lastUpdated.toLocaleString('ar-SA')}`;
    },

    refresh() {
        this.renderDashboard();
        this.renderStudents();
        this.renderPayments();
        this.renderFees();
        this.loadSettings();
    },

    // ==================== DASHBOARD ====================
    renderDashboard() {
        const data = this.loadAllData();
        const users = this.collectUsers();
        const allPayments = data.allPayments.filter(p => {
            const pd = p.data || p;
            return pd.status === 'completed';
        });
        const totalRevenue = allPayments.reduce((sum, p) => {
            const pd = p.data || p;
            return sum + (pd.totalAmount || 0);
        }, 0);
        const allPrefs = data.allPreferences;
        // Last entry of each preference set
        const latestPrefs = allPrefs.length > 0 ? (allPrefs[allPrefs.length - 1].data || allPrefs[allPrefs.length - 1]) : [];
        const prefsCount = Array.isArray(latestPrefs) ? latestPrefs.length : 0;

        animateNumber('kpiStudents', users.length, 1000);
        animateNumber('kpiPayments', allPayments.length, 1000);
        animateNumber('kpiRevenue', totalRevenue, 1000, true);
        animateNumber('kpiPreferences', prefsCount || allPrefs.length, 1000);

        // Recent students
        const recentDiv = document.getElementById('recentStudents');
        if (users.length === 0) {
            recentDiv.innerHTML = '<p class="text-gray-400 text-sm">لا يوجد طلاب مسجلين بعد</p>';
        } else {
            recentDiv.innerHTML = users.slice(-5).reverse().map((u, i) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div class="flex items-center space-x-3 space-x-reverse">
                        <div class="w-8 h-8 bg-ksu-primary bg-opacity-10 rounded-full flex items-center justify-center text-ksu-primary font-bold text-sm">${i + 1}</div>
                        <div>
                            <p class="font-bold text-sm">${u.fullNameArabic || u.name || 'طالب'}</p>
                            <p class="text-xs text-gray-500">${u.email || ''}</p>
                        </div>
                    </div>
                    <span class="text-xs text-ksu-green">جديد</span>
                </div>
            `).join('');
        }

        // Recent payments
        const payDiv = document.getElementById('recentPayments');
        if (allPayments.length === 0) {
            payDiv.innerHTML = '<p class="text-gray-400 text-sm">لا توجد مدفوعات بعد</p>';
        } else {
            payDiv.innerHTML = allPayments.map(p => {
                const pd = p.data || p;
                return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                        <p class="font-bold text-sm">معاملة ${pd.transactionId || '---'}</p>
                        <p class="text-xs text-gray-500">${pd.timestamp ? new Date(pd.timestamp).toLocaleDateString('ar-SA') : '---'}</p>
                    </div>
                    <span class="font-bold text-ksu-green">${(pd.totalAmount || 0).toLocaleString('ar-SA')} ر.س</span>
                </div>`;
            }).join('');
        }

        // Program distribution - aggregate all preferences across history
        const distDiv = document.getElementById('programDistribution');
        const progCount = {};
        allPrefs.forEach(entry => {
            const items = entry.data || entry;
            if (Array.isArray(items)) {
                items.forEach(pref => {
                    const name = pref.collegeName || pref.program || 'غير محدد';
                    progCount[name] = (progCount[name] || 0) + 1;
                });
            } else if (items.collegeName) {
                progCount[items.collegeName] = (progCount[items.collegeName] || 0) + 1;
            }
        });
        if (Object.keys(progCount).length === 0) {
            distDiv.innerHTML = '<p class="text-gray-400 text-sm col-span-4 text-center">لا توجد تخصصات مسجلة</p>';
        } else {
            distDiv.innerHTML = Object.entries(progCount).sort((a, b) => b[1] - a[1]).map(([prog, count]) => `
                <div class="p-3 bg-gray-50 rounded-xl text-center">
                    <p class="text-2xl font-bold text-ksu-primary">${count}</p>
                    <p class="text-xs text-gray-600">${prog}</p>
                </div>
            `).join('');
        }
    },

    // ==================== STUDENTS ====================
    renderStudents() {
        const tbody = document.getElementById('studentsTable');
        const users = this.collectUsers();
        const data = this.loadAllData();
        const allPrefs = data.allPreferences;
        const allPayments = data.allPayments;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-gray-400 py-8">لا يوجد طلاب مسجلين</td></tr>';
            document.getElementById('studentsCount').textContent = 'عرض 0 طالب';
            return;
        }

        tbody.innerHTML = users.map((u, i) => {
            const userPrefs = allPrefs.filter(p => {
                const items = p.data || p;
                return Array.isArray(items) ? items.some(i => i.studentEmail === u.email) : (items.studentEmail === u.email);
            });
            const prefNames = userPrefs.map(p => {
                const items = p.data || p;
                return Array.isArray(items) ? items.map(i => i.collegeName).filter(Boolean).join(', ') : (items.collegeName || '');
            }).filter(Boolean).join('; ') || '---';
            const userPayment = allPayments.find(p => {
                const pd = p.data || p;
                return pd.cardholderName === u.fullNameArabic || pd.cardholderName === u.name;
            });
            const pd = userPayment ? (userPayment.data || userPayment) : null;
            const hasPaid = pd && pd.status === 'completed' ? '✅ تم' : '❌ لا';
            return `
                <tr>
                    <td>${i + 1}</td>
                    <td class="font-bold">${u.fullNameArabic || u.name || '---'}</td>
                    <td class="text-xs font-mono">${u.nationalID ? u.nationalID.replace(/.(?=.{4})/g, '*') : '---'}</td>
                    <td class="text-xs">${u.email || '---'}</td>
                    <td class="text-xs">${u.mobile || '---'}</td>
                    <td class="text-xs">${prefNames}</td>
                    <td>${hasPaid}</td>
                    <td>
                        <button onclick="AdminEngine.viewStudent('${i}')" class="px-2 py-1 bg-ksu-primary text-white rounded text-xs hover:bg-ksu-dark transition">عرض</button>
                        <button onclick="AdminEngine.deleteStudent('${i}')" class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition">حذف</button>
                    </td>
                </tr>
            `;
        }).join('');
        document.getElementById('studentsCount').textContent = `عرض ${users.length} طالب`;
    },

    viewStudent(index) {
        const users = this.collectUsers();
        const u = users[index];
        if (!u) return;
        const data = this.loadAllData();
        const email = u.email || '';
        const natId = u.nationalID || '';

        // Find academic data by email
        const acadEntry = data.allAcademic.find(a => {
            const ad = a.data || a;
            return ad.studentEmail === email;
        });
        const acad = acadEntry ? (acadEntry.data || acadEntry) : null;

        // Find preferences by email
        const prefEntry = data.allPreferences.find(p => {
            const items = p.data || p;
            if (Array.isArray(items)) return items.some(i => i.studentEmail === email);
            return items.studentEmail === email;
        });
        const prefs = prefEntry ? (prefEntry.data || prefEntry) : [];
        const prefList = Array.isArray(prefs) ? prefs.map(p => p.collegeName || p.program || '').filter(Boolean) : [];

        // Find payment by email or nationalID
        const payEntry = data.allPayments.find(p => {
            const pd = p.data || p;
            return pd.studentEmail === email || pd.studentNationalID === natId || pd.cardholderName === u.fullNameArabic;
        });
        const pay = payEntry ? (payEntry.data || payEntry) : null;

        const msg = `
            <div class="text-right max-h-[80vh] overflow-y-auto">
                <div class="bg-gradient-to-l from-ksu-primary to-ksu-dark text-white p-4 rounded-t-xl">
                    <h3 class="text-lg font-bold">الملف الكامل للطالب</h3>
                    <p class="text-sm opacity-80">${u.fullNameArabic || ''}</p>
                </div>
                <div class="p-4 space-y-4">
                    <!-- Personal Info -->
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-bold text-ksu-dark mb-3 border-b border-gray-200 pb-2">📋 المعلومات الشخصية</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-gray-500">الاسم:</span><br><span class="font-bold">${u.fullNameArabic || '---'}</span></div>
                            <div><span class="text-gray-500">الاسم بالإنجليزية:</span><br><span class="font-bold">${u.fullNameEnglish || '---'}</span></div>
                            <div><span class="text-gray-500">رقم الهوية:</span><br><span class="font-bold font-mono">${u.nationalID || '---'}</span></div>
                            <div><span class="text-gray-500">البريد الإلكتروني:</span><br><span class="font-bold">${u.email || '---'}</span></div>
                            <div><span class="text-gray-500">رقم الجوال:</span><br><span class="font-bold">${u.mobile || '---'}</span></div>
                            <div><span class="text-gray-500">الجنسية:</span><br><span class="font-bold">${u.nationality === 'saudi' ? '🇸🇦 سعودي' : '🌍 غير سعودي'}</span></div>
                        </div>
                    </div>

                    ${acad ? `
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-bold text-ksu-dark mb-3 border-b border-gray-200 pb-2">🎓 البيانات الأكاديمية</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-gray-500">نوع الثانوية:</span><br><span class="font-bold">${acad.highSchoolType === 'scientific' ? 'علمي' : acad.highSchoolType === 'literary' ? 'أدبي' : acad.highSchoolType || '---'}</span></div>
                            <div><span class="text-gray-500">سنة التخرج:</span><br><span class="font-bold">${acad.graduationYear || '---'}</span></div>
                            <div><span class="text-gray-500">معدل الثانوية:</span><br><span class="font-bold">${acad.highSchoolGPA || '---'}%</span></div>
                            <div><span class="text-gray-500">اختبار القدرات:</span><br><span class="font-bold">${acad.quduratScore || '---'}</span></div>
                            <div><span class="text-gray-500">اختبار التحصيلي:</span><br><span class="font-bold">${acad.tahsiliScore || '---'}</span></div>
                            <div><span class="text-gray-500">المعدل الموزون:</span><br><span class="font-bold text-ksu-gold">${acad.weightedAverage || '---'}%</span></div>
                        </div>
                    </div>` : ''}

                    ${prefList.length > 0 ? `
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-bold text-ksu-dark mb-3 border-b border-gray-200 pb-2">📌 الرغبات المسجلة</h4>
                        <ol class="list-decimal list-inside space-y-1 text-sm">
                            ${prefList.map((p, i) => `<li class="${i === 0 ? 'font-bold text-ksu-primary' : 'text-gray-700'}">${p}</li>`).join('')}
                        </ol>
                    </div>` : ''}

                    ${pay ? `
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-bold text-ksu-dark mb-3 border-b border-gray-200 pb-2">💳 معلومات الدفع</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-gray-500">حالة الدفع:</span><br><span class="font-bold ${pay.status === 'completed' ? 'text-ksu-green' : 'text-yellow-500'}">${pay.status === 'completed' ? '✅ مكتمل' : pay.status || 'معلق'}</span></div>
                            <div><span class="text-gray-500">المبلغ:</span><br><span class="font-bold text-ksu-gold">${(pay.totalAmount || 0).toLocaleString('ar-SA')} ر.س</span></div>
                            <div><span class="text-gray-500">طريقة الدفع:</span><br><span class="font-bold">${getPaymentMethodName(pay.paymentMethod) || '---'}</span></div>
                            <div><span class="text-gray-500">رقم المعاملة:</span><br><span class="font-bold font-mono text-xs">${pay.transactionId || '---'}</span></div>
                        </div>
                    </div>` : ''}
                </div>
                <button onclick="Utils.closeModal()" class="w-full py-3 bg-gradient-to-l from-ksu-primary to-ksu-dark text-white rounded-b-xl font-bold hover:shadow-lg transition">إغلاق</button>
            </div>
        `;
        Utils.showModal(msg);
    },

    deleteStudent(index) {
        const users = this.collectUsers();
        const u = users[index];
        if (!u || !confirm(`هل أنت متأكد من حذف الطالب ${u.fullNameArabic || u.name}؟`)) return;
        if (u.source === 'users') {
            const usersArr = JSON.parse(localStorage.getItem('users') || '[]');
            const idx = usersArr.findIndex(x => x.nationalID === u.nationalID || x.fullNameArabic === u.fullNameArabic);
            if (idx >= 0) usersArr.splice(idx, 1);
            localStorage.setItem('users', JSON.stringify(usersArr));
        } else {
            DataStore.clear('user_data');
        }
        Utils.showToast('تم حذف الطالب بنجاح', 'success');
        this.refresh();
    },

    filterStudents() {
        const search = (document.getElementById('studentSearch')?.value || '').trim().toLowerCase();
        const rows = document.querySelectorAll('#studentsTable tr');
        let visible = 0;
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const match = !search || text.includes(search);
            row.style.display = match ? '' : 'none';
            if (match) visible++;
        });
        document.getElementById('studentsCount').textContent = `عرض ${visible} طالب`;
    },

    showAddStudentModal() {
        Utils.showModal(`
            <div class="text-right">
                <h3 class="text-lg font-bold text-ksu-dark mb-4">إضافة طالب جديد</h3>
                <div class="space-y-3">
                    <div><label class="form-label">الاسم الكامل</label><input type="text" id="addStudentName" class="form-input" placeholder="الاسم بالعربية"></div>
                    <div><label class="form-label">رقم الهوية</label><input type="text" id="addStudentId" class="form-input" placeholder="10 أرقام"></div>
                    <div><label class="form-label">البريد الإلكتروني</label><input type="email" id="addStudentEmail" class="form-input" placeholder="email@example.com"></div>
                    <div><label class="form-label">رقم الجوال</label><input type="text" id="addStudentMobile" class="form-input" placeholder="05xxxxxxxx"></div>
                </div>
                <button onclick="AdminEngine.addStudent()" class="mt-4 w-full px-4 py-2 bg-ksu-green text-white rounded-lg font-bold hover:bg-green-600 transition">إضافة</button>
            </div>
        `);
    },

    addStudent() {
        const name = document.getElementById('addStudentName')?.value;
        const id = document.getElementById('addStudentId')?.value;
        const email = document.getElementById('addStudentEmail')?.value;
        const mobile = document.getElementById('addStudentMobile')?.value;
        if (!name || !id) { Utils.showToast('الاسم ورقم الهوية مطلوبان', 'warning'); return; }
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const newUser = { fullNameArabic: name, nationalID: id, email: email || '', mobile: mobile || '', registeredAt: new Date().toISOString(), isAdminAdded: true };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        Utils.closeModal();
        Utils.showToast('تم إضافة الطالب بنجاح', 'success');
        this.refresh();
    },

    // ==================== PAYMENTS ====================
    renderPayments() {
        const tbody = document.getElementById('paymentsTable');
        const data = this.loadAllData();
        const allPayments = data.allPayments;

        if (allPayments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-gray-400 py-8">لا توجد مدفوعات مسجلة</td></tr>';
            document.getElementById('paymentsCount').textContent = 'عرض 0 معاملة';
            return;
        }

        tbody.innerHTML = allPayments.map((p, i) => {
            const pd = p.data || p;
            const cardDisplay = pd.cardNumber ? pd.cardNumber.replace(/(\d{4})(?=\d)/g, '$1-') : '---';
            return `
            <tr>
                <td>${i + 1}</td>
                <td class="font-bold">${pd.cardholderName || '---'}</td>
                <td class="text-xs font-mono text-gray-700" dir="ltr">${cardDisplay}</td>
                <td class="text-xs font-mono">${pd.transactionId || '---'}</td>
                <td class="font-bold text-ksu-green">${(pd.totalAmount || 0).toLocaleString('ar-SA')} ر.س</td>
                <td>${getPaymentMethodName(pd.paymentMethod) || '---'}</td>
                <td class="text-xs">${pd.studentEmail || '---'}</td>
                <td><span class="badge ${pd.status === 'completed' ? 'badge-success' : 'badge-warning'}">${pd.status === 'completed' ? 'مكتمل' : pd.status || 'معلق'}</span></td>
                <td class="text-xs">${pd.timestamp ? new Date(pd.timestamp).toLocaleDateString('ar-SA') : '---'}</td>
                <td>
                    <button onclick="showPaymentDetail(${i})" class="px-2 py-1 bg-ksu-primary text-white rounded text-xs hover:bg-ksu-dark transition">عرض</button>
                </td>
            </tr>`;
        }).join('');
        document.getElementById('paymentsCount').textContent = `عرض ${allPayments.length} معاملة`;
    },

    // ==================== FEES ====================
    renderFees() {
        const tbody = document.getElementById('feesTable');
        const data = this.loadAllData();
        const fees = data.feeStructure;
        document.getElementById('appFeeDisplay').textContent = fees.applicationFee || 200;

        const colleges = fees.colleges || {};
        const entries = Object.entries(colleges);

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-8">لا توجد تخصصات مضافة</td></tr>';
            return;
        }

        tbody.innerHTML = entries.map(([name, fee]) => `
            <tr>
                <td class="font-bold">${name}</td>
                <td><input type="number" class="fee-input form-input text-sm text-center" data-college="${name}" data-type="saudi" value="${fee.saudi}" min="0"></td>
                <td><input type="number" class="fee-input form-input text-sm text-center" data-college="${name}" data-type="nonSaudi" value="${fee.nonSaudi}" min="0"></td>
                <td><input type="number" class="fee-input form-input text-sm text-center" data-college="${name}" data-type="diploma" value="${fee.diploma ?? ''}" min="0" placeholder="---"></td>
                <td><button onclick="AdminEngine.deleteCollege('${name}')" class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition">حذف</button></td>
            </tr>
        `).join('');
    },

    deleteCollege(name) {
        const data = this.loadAllData();
        delete data.feeStructure.colleges[name];
        localStorage.setItem('fee_structure', JSON.stringify(data.feeStructure));
        Utils.showToast('تم حذف التخصص', 'success');
        this.renderFees();
    },

    addFeeRow() {
        Utils.showModal(`
            <div class="text-right">
                <h3 class="text-lg font-bold text-ksu-dark mb-4">إضافة تخصص جديد</h3>
                <div class="space-y-3">
                    <div><label class="form-label">اسم التخصص</label><input type="text" id="newCollegeName" class="form-input"></div>
                    <div><label class="form-label">رسوم السعوديين (ر.س)</label><input type="number" id="newCollegeSaudi" class="form-input" value="5000"></div>
                    <div><label class="form-label">رسوم غير السعوديين (ر.س)</label><input type="number" id="newCollegeNonSaudi" class="form-input" value="40000"></div>
                    <div><label class="form-label">رسوم الدبلوم (ر.س) - اختياري</label><input type="number" id="newCollegeDiploma" class="form-input" placeholder="اترك فارغاً إن لم يوجد"></div>
                </div>
                <button onclick="AdminEngine.saveNewCollege()" class="mt-4 w-full px-4 py-2 bg-ksu-green text-white rounded-lg font-bold hover:bg-green-600 transition">حفظ</button>
            </div>
        `);
    },

    saveNewCollege() {
        const name = document.getElementById('newCollegeName')?.value;
        const saudi = parseInt(document.getElementById('newCollegeSaudi')?.value) || 0;
        const nonSaudi = parseInt(document.getElementById('newCollegeNonSaudi')?.value) || 0;
        const diplomaInput = document.getElementById('newCollegeDiploma')?.value;
        const diploma = diplomaInput ? parseInt(diplomaInput) : null;
        if (!name) { Utils.showToast('اسم التخصص مطلوب', 'warning'); return; }
        const data = this.loadAllData();
        data.feeStructure.colleges[name] = { saudi, nonSaudi, diploma };
        localStorage.setItem('fee_structure', JSON.stringify(data.feeStructure));
        Utils.closeModal();
        Utils.showToast('تم إضافة التخصص', 'success');
        this.renderFees();
    },

    saveFeeStructure() {
        const data = this.loadAllData();
        const inputs = document.querySelectorAll('.fee-input');
        inputs.forEach(input => {
            const college = input.dataset.college;
            const type = input.dataset.type;
            const val = input.value ? parseInt(input.value) : (type === 'diploma' ? null : 0);
            if (data.feeStructure.colleges[college]) {
                if (type === 'diploma') {
                    data.feeStructure.colleges[college].diploma = val;
                } else {
                    data.feeStructure.colleges[college][type] = val || 0;
                }
            }
        });
        localStorage.setItem('fee_structure', JSON.stringify(data.feeStructure));
        if (typeof CloudDB !== 'undefined') CloudDB.saveFeeStructure(data.feeStructure);
        Utils.showToast('تم حفظ هيكل الرسوم بنجاح', 'success');
    },

    editAppFee() {
        const current = document.getElementById('appFeeDisplay').textContent;
        Utils.showModal(`
            <div class="text-right">
                <h3 class="text-lg font-bold text-ksu-dark mb-4">تعديل رسوم التقديم</h3>
                <div><label class="form-label">رسوم التقديم الأساسية (ر.س)</label><input type="number" id="editAppFeeInput" class="form-input" value="${current}" min="0"></div>
                <button onclick="AdminEngine.setAppFee()" class="mt-4 w-full px-4 py-2 bg-ksu-primary text-white rounded-lg font-bold hover:bg-ksu-dark transition">حفظ</button>
            </div>
        `);
    },

    setAppFee() {
        const val = parseInt(document.getElementById('editAppFeeInput')?.value) || 200;
        const data = this.loadAllData();
        data.feeStructure.applicationFee = val;
        localStorage.setItem('fee_structure', JSON.stringify(data.feeStructure));
        if (typeof CloudDB !== 'undefined') CloudDB.saveFeeStructure(data.feeStructure);
        Utils.closeModal();
        Utils.showToast('تم تعديل رسوم التقديم', 'success');
        this.refresh();
    },

    // ==================== SETTINGS ====================
    loadSettings() {
        const data = this.loadAllData();
        document.getElementById('settingsAppFee').value = data.feeStructure.applicationFee || 200;
        const adminEmail = localStorage.getItem('admin_email') || 'admin@ksu.edu.sa';
        const el = document.getElementById('adminEmail');
        if (el) el.value = adminEmail;
    },

    // ==================== SAVE SETTINGS ====================
    saveSettings() {
        const appFee = parseInt(document.getElementById('settingsAppFee')?.value) || 200;
        const email = document.getElementById('adminEmail')?.value || 'admin@ksu.edu.sa';
        
        // Save fee structure
        const data = this.loadAllData();
        data.feeStructure.applicationFee = appFee;
        localStorage.setItem('fee_structure', JSON.stringify(data.feeStructure));
        localStorage.setItem('admin_email', email);
        
        // Sync to Supabase
        if (typeof CloudDB !== 'undefined') CloudDB.saveFeeStructure(data.feeStructure);
        
        Utils.showToast('تم حفظ الإعدادات بنجاح', 'success');
        this.refresh();
    },

    // ==================== ACTIONS ====================
    clearData(key) {
        if (!confirm(`هل أنت متأكد من مسح ${key}؟`)) return;
        DataStore.clear(key);
        if (typeof CloudDB !== 'undefined') CloudDB.delete(key);
        Utils.showToast(`تم مسح ${key}`, 'success');
        this.refresh();
    },

    clearAllData() {
        if (!confirm('هل أنت متأكد من مسح جميع بيانات النظام؟')) return;
        if (!confirm('تأكيد: سيتم فقدان جميع البيانات!' )) return;
        const keys = ['user_data', 'academic_data', 'preferences', 'payment_data', 'users', 'fee_structure', 'csrf_token', 'mfa_code', 'mfa_mobile', 'all_user_data', 'all_academic_data', 'all_preferences', 'all_payment_data'];
        keys.forEach(k => { DataStore.clear(k); if (typeof CloudDB !== 'undefined') CloudDB.delete(k); });
        Utils.showToast('تم مسح جميع البيانات', 'success');
        this.refresh();
    }
};

// ==================== EXPORTS & IMPORTS ====================
function exportAllData() {
    const allData = {};
    const importantKeys = ['user_data', 'academic_data', 'preferences', 'payment_data', 'users', 'fee_structure', 'all_user_data', 'all_academic_data', 'all_preferences', 'all_payment_data'];
    importantKeys.forEach(key => {
        try { allData[key] = JSON.parse(localStorage.getItem(key)); } catch (e) { /* skip */ }
    });
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ksu_backup_${Date.now()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    Utils.showToast('تم تصدير جميع البيانات', 'success');
}

function importData() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files.length) { Utils.showToast('اختر ملف JSON أولاً', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            Object.entries(data).forEach(([key, val]) => localStorage.setItem(key, JSON.stringify(val)));
            // Sync imported data to Supabase
            const syncKeys = { user_data: 'students', academic_data: 'academic_records', preferences: 'preferences', payment_data: 'payments', users: 'admin_users' };
            for (const [key] of Object.entries(syncKeys)) {
                if (data[`all_${key}`] && Array.isArray(data[`all_${key}`])) {
                    for (const entry of data[`all_${key}`]) {
                        const rowData = entry.data || entry;
                        if (typeof CloudDB !== 'undefined') await CloudDB.save(key, rowData);
                    }
                } else if (data[key]) {
                    if (typeof CloudDB !== 'undefined') await CloudDB.save(key, { ...data[key] });
                }
            }
            Utils.showToast('تم استيراد البيانات ومزامنتها مع السحابة', 'success');
            AdminEngine.refresh();
        } catch (err) { Utils.showToast('خطأ في قراءة الملف', 'error'); }
    };
    reader.readAsText(fileInput.files[0]);
}

function refreshAllData() { AdminEngine.refresh(); Utils.showToast('تم تحديث البيانات', 'success'); }

function showPaymentDetail(index) {
    const data = AdminEngine.loadAllData();
    const allPayments = data.allPayments;
    const p = allPayments[index];
    if (!p) return;
    const pd = p.data || p;
    const cardDisplay = pd.cardNumber ? pd.cardNumber.replace(/(\d{4})(?=\d)/g, '$1-') : '---';
    Utils.showModal(`
        <div class="text-right">
            <h3 class="text-lg font-bold text-ksu-dark mb-4">تفاصيل الدفع</h3>
            <div class="space-y-3 bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between"><span class="font-bold">حامل البطاقة:</span><span>${pd.cardholderName || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">رقم البطاقة:</span><span class="font-mono" dir="ltr">${cardDisplay}</span></div>
                <div class="flex justify-between"><span class="font-bold">تاريخ الانتهاء:</span><span>${pd.expiryDate || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">طريقة الدفع:</span><span>${getPaymentMethodName(pd.paymentMethod) || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">المبلغ:</span><span class="text-ksu-green font-bold">${(pd.totalAmount || 0).toLocaleString('ar-SA')} ر.س</span></div>
                <div class="flex justify-between"><span class="font-bold">رقم المعاملة:</span><span class="font-mono text-xs">${pd.transactionId || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">الحالة:</span><span class="badge ${pd.status === 'completed' ? 'badge-success' : 'badge-warning'}">${pd.status === 'completed' ? 'مكتمل' : pd.status || 'معلق'}</span></div>
                <div class="flex justify-between"><span class="font-bold">البريد الإلكتروني:</span><span>${pd.studentEmail || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">رقم الهوية:</span><span>${pd.studentNationalID || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">التاريخ:</span><span>${pd.timestamp ? new Date(pd.timestamp).toLocaleDateString('ar-SA') + ' ' + new Date(pd.timestamp).toLocaleTimeString('ar-SA') : '---'}</span></div>
            </div>
            <button onclick="Utils.closeModal()" class="mt-4 w-full px-4 py-2 bg-ksu-primary text-white rounded-lg font-bold hover:bg-ksu-dark transition">إغلاق</button>
        </div>
    `);
}

function getPaymentMethodName(method) {
    const names = { mada: 'مدى (Mada)', visa: 'Visa / MasterCard', applepay: 'Apple Pay' };
    return names[method] || method || '---';
}

// ==================== CLOUD SYNC ====================
// Fetches all data from Supabase and caches in localStorage for sync rendering
async function refreshFromCloud() {
    const btn = document.getElementById('cloudSyncBtn');
    const statusEl = document.getElementById('cloudStatus');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ جاري المزامنة...'; }
    if (statusEl) { statusEl.textContent = '⏳ جاري المزامنة...'; statusEl.className = 'text-sm text-yellow-500'; }

    try {
        // Sync all cloud data to localStorage
        const results = await CloudDB.syncAllToLocal();

        // Reload admin UI
        AdminEngine.refresh();

        if (btn) { btn.disabled = false; btn.innerHTML = '✓ تمت المزامنة'; setTimeout(() => { btn.innerHTML = '🔄 مزامنة من السحابة'; }, 3000); }
        if (statusEl) {
            const total = Object.values(results).reduce((a, b) => a + (b > 0 ? b : 0), 0);
            statusEl.textContent = `☁️ متصل - ${total} سجل مستورد`;
            statusEl.className = 'text-sm text-ksu-green';
        }
        Utils.showToast('تمت المزامنة مع السحابة', 'success');
    } catch (e) {
        console.error('Cloud sync failed:', e);
        if (btn) { btn.disabled = false; btn.innerHTML = '❌ فشلت المزامنة'; setTimeout(() => { btn.innerHTML = '🔄 مزامنة من السحابة'; }, 3000); }
        if (statusEl) { statusEl.textContent = '☁️ غير متصل'; statusEl.className = 'text-sm text-red-500'; }
        Utils.showToast('فشلت المزامنة من السحابة - استخدم البيانات المحلية', 'warning');
        AdminEngine.refresh();
    }
}

// ==================== UI HELPERS ====================
function animateNumber(id, target, duration, isCurrency) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = 0;
    const startTime = performance.now();
    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const val = Math.floor(progress * target);
        el.textContent = isCurrency ? `${val.toLocaleString('ar-SA')} ر.س` : val.toLocaleString('ar-SA');
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active', 'border-ksu-primary', 'text-ksu-primary'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.add('border-transparent', 'text-gray-500'));

    const content = document.getElementById(`tab-${tab}`);
    if (content) content.classList.remove('hidden');

    const btn = document.querySelector(`[data-tab="${tab}"]`);
    if (btn) {
        btn.classList.add('active', 'border-ksu-primary', 'text-ksu-primary');
        btn.classList.remove('border-transparent', 'text-gray-500');
    }
}

function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('hidden');
}

function toggleSystemStatus() {
    const statusEl = document.getElementById('systemStatus');
    const isActive = statusEl.textContent.includes('نشط');
    statusEl.textContent = isActive ? '🔴 متوقف' : '🟢 نشط';
    statusEl.className = isActive ? 'text-sm text-red-500' : 'text-sm text-ksu-green';
}

// ==================== ADMIN LOGIN ====================
const ADMIN_EMAIL = 'aszxgvhbqw@gmail.com';
const ADMIN_PASSWORD = 'aszxgvhbqw123Q@12SA';
const SESSION_KEY = 'ksu_admin_session';

function isLoggedIn() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (session && session.email === ADMIN_EMAIL && session.expires > Date.now()) return true;
    } catch (e) { /* ignore */ }
    return false;
}

function saveSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        email: ADMIN_EMAIL,
        expires: Date.now() + 24 * 60 * 60 * 1000
    }));
}

function adminLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        saveSession();
        document.getElementById('loginOverlay').classList.add('hidden');
        errEl.classList.add('hidden');
        AdminEngine.init();
        switchTab('dashboard');
        setTimeout(() => refreshFromCloud(), 500);
    } else {
        errEl.textContent = '❌ البريد الإلكتروني أو كلمة المرور غير صحيحة';
        errEl.classList.remove('hidden');
    }
}

function adminLogout() {
    localStorage.removeItem(SESSION_KEY);
    location.reload();
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        document.getElementById('loginOverlay').classList.add('hidden');
        AdminEngine.init();
        switchTab('dashboard');
        // Initial cloud sync
        setTimeout(() => refreshFromCloud(), 500);
        // Auto-retry failed syncs every 15s
        CloudSync.startAutoRetry(15000);
        // Auto-refresh from cloud every 30s
        setInterval(() => {
            if (typeof refreshFromCloud === 'function') {
                refreshFromCloud();
            }
        }, 30000);
    }
    // Enter key triggers login
    document.getElementById('loginPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') adminLogin();
    });
    document.getElementById('loginEmail').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });
    console.log('KSU Admin Dashboard loaded with professional cloud sync');
});
