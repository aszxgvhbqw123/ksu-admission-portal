const AdminEngine = {
    tabs: ['dashboard', 'students', 'payments', 'fees', 'settings'],
    activeTab: 'dashboard',

    loadAllData() {
        const cloudUsers = (() => {
            try {
                const raw = localStorage.getItem('_cloud_all_user_data');
                if (raw) return JSON.parse(raw).map(r => ({ data: r.data || r }));
            } catch { /* ignore */ }
            return null;
        })();
        return {
            allUsers: cloudUsers || DataStore.getHistory('user_data'),
            allPayments: (() => {
                try {
                    const raw = localStorage.getItem('_cloud_all_payment_data');
                    if (raw) return JSON.parse(raw).map(r => ({ data: r.data || r }));
                } catch { /* ignore */ }
                return DataStore.getHistory('payment_data');
            })(),
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
                'الأمن السيبراني الطبي': { saudi: 12000, nonSaudi: 75000, diploma: 4500 },
                'إدارة المستشفيات': { saudi: 10000, nonSaudi: 70000, diploma: 4200 },
                'التقنية الصحية': { saudi: 12000, nonSaudi: 80000, diploma: 4800 },
                'الأشعة التشخيصية': { saudi: 13000, nonSaudi: 85000, diploma: 4600 },
                'التمريض العام': { saudi: 11000, nonSaudi: 75000, diploma: 4400 },
                'الأمن السيبراني': { saudi: 12000, nonSaudi: 75000, diploma: 4000 },
                'علوم الحاسب': { saudi: 10000, nonSaudi: 70000, diploma: 3500 },
                'الشبكات والاتصالات': { saudi: 10000, nonSaudi: 65000, diploma: 3800 },
                'هندسة البرمجيات': { saudi: 10000, nonSaudi: 70000, diploma: 3600 },
                'الذكاء الاصطناعي': { saudi: 12000, nonSaudi: 80000, diploma: 4200 },
                'أنظمة المعلومات': { saudi: 9000, nonSaudi: 65000, diploma: 3400 },
                'إدارة البيانات وتحليلها': { saudi: 10000, nonSaudi: 70000, diploma: 3700 },
                'إدارة الأعمال': { saudi: 8000, nonSaudi: 55000, diploma: 2800 },
                'المحاسبة والمراجعة': { saudi: 8000, nonSaudi: 55000, diploma: 2500 },
                'التسويق الرقمي': { saudi: 8000, nonSaudi: 55000, diploma: 3000 },
                'الموارد البشرية': { saudi: 7000, nonSaudi: 50000, diploma: 2700 },
                'إدارة المشاريع': { saudi: 8000, nonSaudi: 55000, diploma: 2900 },
                'إدارة اللوجستيات وسلاسل الإمداد': { saudi: 8000, nonSaudi: 55000, diploma: 3100 },
                'المالية والاستثمار': { saudi: 9000, nonSaudi: 60000, diploma: 3200 },
                'اللغات والترجمة': { saudi: 5000, nonSaudi: 45000, diploma: 2200 },
                'القانون': { saudi: 7000, nonSaudi: 50000, diploma: 2000 },
                'الإعلام الرقمي': { saudi: 6000, nonSaudi: 45000, diploma: 2400 },
                'علم النفس التطبيقي': { saudi: 5000, nonSaudi: 40000, diploma: 2100 },
                'التربية الخاصة': { saudi: 5000, nonSaudi: 40000, diploma: 2000 },
                'التاريخ والحضارة الإسلامية': { saudi: 4000, nonSaudi: 35000, diploma: 1800 },
                'الإرشاد النفسي': { saudi: 5000, nonSaudi: 40000, diploma: 2300 }
            }
        };
    },

    collectUsers() {
        const userMap = new Map();
        const cloudRaw = localStorage.getItem('_cloud_all_user_data');
        if (cloudRaw) {
            try {
                const items = JSON.parse(cloudRaw);
                items.forEach((entry, i) => {
                    const s = entry.data || entry;
                    if (s.full_name || s.national_id) {
                        userMap.set(`cloud_${i}`, {
                            fullNameArabic: s.full_name || s.fullNameArabic || '',
                            fullNameEnglish: s.full_name_en || s.fullNameEnglish || '',
                            nationalID: s.national_id || s.nationalID || '',
                            email: s.email || '',
                            mobile: s.phone || s.mobile || '',
                            nationality: s.nationality || 'saudi',
                            subscription: s.subscription || null,
                            academic: s.academic || null,
                            source: 'cloud'
                        });
                    }
                });
            } catch { /* ignore */ }
        }
        if (userMap.size === 0) {
            const allUsers = DataStore.getHistory('user_data');
            allUsers.forEach((u, i) => {
                const ud = u.data || u;
                if (ud.fullNameArabic || ud.nationalID) {
                    userMap.set(`all_user_data_${i}`, { ...ud, source: 'all_user_data' });
                }
            });
        }
        const userData = DataStore.getCurrent('user_data');
        if (userData && (userData.fullNameArabic || userData.nationalID)) {
            const exists = Array.from(userMap.values()).some(u => u.nationalID === userData.nationalID);
            if (!exists) userMap.set('user_data', { ...userData, source: 'user_data' });
        }
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
        this.syncFromCloud();
    },

    async syncFromCloud() {
        try {
            const users = await CloudDB.fetch('all_user_data');
            if (users && users.length > 0) {
                const payments = users.filter(s => s.data && s.data.subscription).map(s => ({
                    data: { ...s.data.subscription, studentEmail: s.data.email, studentNationalID: s.data.national_id, studentName: s.data.full_name }
                }));
                localStorage.setItem('_cloud_all_payment_data', JSON.stringify(payments));
                const acad = users.filter(s => s.data && s.data.academic).map(s => ({
                    data: { ...s.data.academic, studentEmail: s.data.email }
                }));
                localStorage.setItem('_cloud_all_academic_data', JSON.stringify(acad));
                this.refresh();
            }
        } catch (e) {
            console.warn('[AdminEngine] cloud sync failed, using local data:', e.message);
        }
    },

    _getToken() { return ''; },

    refresh() {
        this.renderDashboard();
        this.renderStudents();
        this.renderPayments();
        this.renderFees();
        this.loadSettings();
    },

    renderDashboard() {
        const data = this.loadAllData();
        const users = this.collectUsers();
        const allPayments = data.allPayments.filter(p => {
            const pd = p.data || p;
            return pd.status === 'completed' || pd.billing_status === 'active';
        });
        const totalRevenue = allPayments.reduce((sum, p) => {
            const pd = p.data || p;
            return sum + (pd.totalAmount || pd.total_amount || 0);
        }, 0);
        const allPrefs = data.allPreferences;
        const latestPrefs = allPrefs.length > 0 ? (allPrefs[allPrefs.length - 1].data || allPrefs[allPrefs.length - 1]) : [];
        const prefsCount = Array.isArray(latestPrefs) ? latestPrefs.length : 0;

        animateNumber('kpiStudents', users.length, 1000);
        animateNumber('kpiPayments', allPayments.length, 1000);
        animateNumber('kpiRevenue', totalRevenue, 1000, true);
        animateNumber('kpiPreferences', prefsCount || allPrefs.length, 1000);

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
                    <span class="text-xs ${u.subscription ? 'text-ksu-green' : 'text-gray-400'}">${u.subscription ? '🟢 مشترك' : 'جديد'}</span>
                </div>
            `).join('');
        }

        const payDiv = document.getElementById('recentPayments');
        if (allPayments.length === 0) {
            payDiv.innerHTML = '<p class="text-gray-400 text-sm">لا توجد مدفوعات بعد</p>';
        } else {
            payDiv.innerHTML = allPayments.map(p => {
                const pd = p.data || p;
                return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                        <p class="font-bold text-sm">معاملة ${pd.transactionId || pd.transaction_id || '---'}</p>
                        <p class="text-xs text-gray-500">${pd.timestamp ? new Date(pd.timestamp).toLocaleDateString('ar-SA') : '---'}</p>
                    </div>
                    <span class="font-bold text-ksu-green">${(pd.totalAmount || pd.total_amount || 0).toLocaleString('ar-SA')} ر.س</span>
                </div>`;
            }).join('');
        }

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

    renderStudents() {
        const tbody = document.getElementById('studentsTable');
        const users = this.collectUsers();
        const data = this.loadAllData();
        const allPrefs = data.allPreferences;
        const allPayments = data.allPayments;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-gray-400 py-8">لا يوجد طلاب مسجلين</td></tr>';
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

            const sub = u.subscription;
            const isSubActive = sub && (sub.billing_status === 'active' || sub.status === 'completed');
            const gatewayToken = sub ? (sub.gateway_token || sub.gatewayToken || '---') : '---';
            const maskedCard = sub ? (sub.masked_card || sub.maskedCard || '---') : '---';

            const userPayment = allPayments.find(p => {
                const pd = p.data || p;
                return pd.cardholderName === u.fullNameArabic || pd.cardholderName === u.name || pd.studentEmail === u.email;
            });
            const pd = userPayment ? (userPayment.data || userPayment) : null;
            const hasPaid = pd && (pd.status === 'completed' || pd.billing_status === 'active') ? '✅ تم' : '❌ لا';
            return `
                <tr>
                    <td>${i + 1}</td>
                    <td class="font-bold">${u.fullNameArabic || u.name || '---'}</td>
                    <td class="text-xs font-mono">${u.nationalID ? u.nationalID.replace(/.(?=.{4})/g, '*') : '---'}</td>
                    <td class="text-xs">${u.email || '---'}</td>
                    <td class="text-xs">${u.mobile || u.phone || '---'}</td>
                    <td class="text-xs">${prefNames}</td>
                    <td>${hasPaid}</td>
                    <td><span class="badge ${isSubActive ? 'badge-success' : 'badge-warning'}">${isSubActive ? '🟢 اشتراك نشط' : '🔴 غير مشترك'}</span></td>
                    <td class="text-xs font-mono" dir="ltr" title="${gatewayToken}">${gatewayToken.length > 16 ? gatewayToken.slice(0, 16) + '…' : gatewayToken}</td>
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

        const acadEntry = data.allAcademic.find(a => {
            const ad = a.data || a;
            return ad.studentEmail === email;
        });
        const acad = acadEntry ? (acadEntry.data || acadEntry) : null;

        const prefEntry = data.allPreferences.find(p => {
            const items = p.data || p;
            if (Array.isArray(items)) return items.some(i => i.studentEmail === email);
            return items.studentEmail === email;
        });
        const prefs = prefEntry ? (prefEntry.data || prefEntry) : [];
        const prefList = Array.isArray(prefs) ? prefs.map(p => p.collegeName || p.program || '').filter(Boolean) : [];

        const sub = u.subscription;
        const isSubActive = sub && (sub.billing_status === 'active' || sub.status === 'completed');
        const gatewayToken = sub ? (sub.gateway_token || sub.gatewayToken || '---') : '---';
        const maskedCard = sub ? (sub.masked_card || sub.maskedCard || '---') : '---';

        const msg = `
            <div class="text-right max-h-[80vh] overflow-y-auto">
                <div class="bg-gradient-to-l from-ksu-primary to-ksu-dark text-white p-4 rounded-t-xl">
                    <h3 class="text-lg font-bold">الملف الكامل للطالب</h3>
                    <p class="text-sm opacity-80">${u.fullNameArabic || ''}</p>
                </div>
                <div class="p-4 space-y-4">
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-bold text-ksu-dark mb-3 border-b border-gray-200 pb-2">📋 المعلومات الشخصية</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-gray-500">الاسم:</span><br><span class="font-bold">${u.fullNameArabic || '---'}</span></div>
                            <div><span class="text-gray-500">الاسم بالإنجليزية:</span><br><span class="font-bold">${u.fullNameEnglish || '---'}</span></div>
                            <div><span class="text-gray-500">رقم الهوية:</span><br><span class="font-bold font-mono">${u.nationalID || '---'}</span></div>
                            <div><span class="text-gray-500">البريد الإلكتروني:</span><br><span class="font-bold">${u.email || '---'}</span></div>
                            <div><span class="text-gray-500">رقم الجوال:</span><br><span class="font-bold">${u.mobile || u.phone || '---'}</span></div>
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

                    ${sub ? `
                    <div class="bg-gray-50 rounded-xl p-4">
                        <h4 class="font-bold text-ksu-dark mb-3 border-b border-gray-200 pb-2">💳 الاشتراك والدفع</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div><span class="text-gray-500">حالة الاشتراك:</span><br><span class="font-bold ${isSubActive ? 'text-ksu-green' : 'text-yellow-500'}">${isSubActive ? '🟢 اشتراك نشط' : '🔴 غير نشط'}</span></div>
                            <div><span class="text-gray-500">المبلغ:</span><br><span class="font-bold text-ksu-gold">${(sub.totalAmount || sub.total_amount || 0).toLocaleString('ar-SA')} ر.س</span></div>
                            <div><span class="text-gray-500">طريقة الدفع:</span><br><span class="font-bold">${getPaymentMethodName(sub.paymentMethod || sub.payment_method) || '---'}</span></div>
                            <div><span class="text-gray-500">رمز البوابة:</span><br><span class="font-bold font-mono text-xs" dir="ltr">${gatewayToken}</span></div>
                            <div><span class="text-gray-500">البطاقة:</span><br><span class="font-bold font-mono text-xs" dir="ltr">${maskedCard}</span></div>
                            <div><span class="text-gray-500">رقم المعاملة:</span><br><span class="font-bold font-mono text-xs">${sub.transactionId || sub.transaction_id || '---'}</span></div>
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

    renderPayments() {
        const tbody = document.getElementById('paymentsTable');
        const data = this.loadAllData();
        const allPayments = data.allPayments;

        if (allPayments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center text-gray-400 py-8">لا توجد مدفوعات مسجلة</td></tr>';
            document.getElementById('paymentsCount').textContent = 'عرض 0 معاملة';
            return;
        }

        tbody.innerHTML = allPayments.map((p, i) => {
            const pd = p.data || p;
            const cardDisplay = pd.maskedCard || pd.masked_card || (pd.cardNumber ? pd.cardNumber.replace(/(\d{4})(?=\d)/g, '$1-') : '---');
            const isSubActive = pd.billing_status === 'active' || pd.status === 'completed';
            return `
            <tr>
                <td>${i + 1}</td>
                <td class="font-bold">${pd.cardholderName || pd.cardholder_name || pd.studentName || '---'}</td>
                <td class="text-xs font-mono text-gray-700" dir="ltr">${cardDisplay}</td>
                <td class="text-xs font-mono">${pd.transactionId || pd.transaction_id || '---'}</td>
                <td class="text-xs font-mono" dir="ltr" title="${pd.gatewayToken || pd.gateway_token || '---'}">${(pd.gatewayToken || pd.gateway_token || '---').slice(0, 20)}…</td>
                <td class="font-bold text-ksu-green">${(pd.totalAmount || pd.total_amount || 0).toLocaleString('ar-SA')} ر.س</td>
                <td>${getPaymentMethodName(pd.paymentMethod || pd.payment_method) || '---'}</td>
                <td class="text-xs">${pd.studentEmail || '---'}</td>
                <td><span class="badge ${isSubActive ? 'badge-success' : 'badge-warning'}">${isSubActive ? '🟢 اشتراك نشط' : pd.status === 'completed' ? 'مكتمل' : pd.status || 'معلق'}</span></td>
                <td class="text-xs">${pd.timestamp ? new Date(pd.timestamp).toLocaleDateString('ar-SA') : '---'}</td>
                <td>
                    <button onclick="showPaymentDetail(${i})" class="px-2 py-1 bg-ksu-primary text-white rounded text-xs hover:bg-ksu-dark transition">عرض</button>
                </td>
            </tr>`;
        }).join('');
        document.getElementById('paymentsCount').textContent = `عرض ${allPayments.length} معاملة`;
    },

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

    loadSettings() {
        const data = this.loadAllData();
        document.getElementById('settingsAppFee').value = data.feeStructure.applicationFee || 200;
        const adminEmail = localStorage.getItem('admin_email') || 'admin@ksu.edu.sa';
        const el = document.getElementById('adminEmail');
        if (el) el.value = adminEmail;
    },

    saveSettings() {
        const appFee = parseInt(document.getElementById('settingsAppFee')?.value) || 200;
        const email = document.getElementById('adminEmail')?.value || 'admin@ksu.edu.sa';
        const data = this.loadAllData();
        data.feeStructure.applicationFee = appFee;
        localStorage.setItem('fee_structure', JSON.stringify(data.feeStructure));
        localStorage.setItem('admin_email', email);
        if (typeof CloudDB !== 'undefined') CloudDB.saveFeeStructure(data.feeStructure);
        Utils.showToast('تم حفظ الإعدادات بنجاح', 'success');
        this.refresh();
    },

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

async function uploadLocalToCloud() {
    if (!confirm('هل تريد رفع جميع البيانات المحلية إلى السحابة؟')) return;
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري الرفع...';

    const keys = ['user_data', 'academic_data', 'preferences', 'payment_data'];
    let total = 0, success = 0;
    const uploaded = [];

    for (const key of keys) {
        const allData = DataStore.getHistory(key);
        for (const entry of allData) {
            const data = entry.data || entry;
            if (data && typeof data === 'object') {
                total++;
                try {
                    await CloudDB.save(key, data);
                    success++;
                    uploaded.push(key);
                } catch (e) {
                    console.warn(`[UploadLocal] Failed ${key}:`, e);
                }
            }
        }
    }

    try {
        const feeData = JSON.parse(localStorage.getItem('fee_structure'));
        if (feeData) {
            await CloudDB.saveFeeStructure(feeData);
            success++;
        }
    } catch (e) { /* ignore */ }

    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        for (const u of users) {
            await CloudDB.save('admin_users', u);
            success++;
        }
    } catch (e) { /* ignore */ }

    btn.disabled = false;
    btn.innerHTML = '☁️ رفع جميع البيانات المحلية إلى السحابة';
    Utils.showToast(`✅ تم رفع ${success} من ${total + 1} سجل إلى السحابة`, 'success');
    AdminEngine.refresh();
}

function showPaymentDetail(index) {
    const data = AdminEngine.loadAllData();
    const allPayments = data.allPayments;
    const p = allPayments[index];
    if (!p) return;
    const pd = p.data || p;
    const cardDisplay = pd.maskedCard || pd.masked_card || (pd.cardNumber ? pd.cardNumber.replace(/(\d{4})(?=\d)/g, '$1-') : '---');
    const isSubActive = pd.billing_status === 'active' || pd.status === 'completed';
    const gatewayToken = pd.gatewayToken || pd.gateway_token || '---';
    Utils.showModal(`
        <div class="text-right">
            <h3 class="text-lg font-bold text-ksu-dark mb-4">تفاصيل الدفع</h3>
            <div class="space-y-3 bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between"><span class="font-bold">حامل البطاقة:</span><span>${pd.cardholderName || pd.cardholder_name || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">رقم البطاقة:</span><span class="font-mono" dir="ltr">${cardDisplay}</span></div>
                <div class="flex justify-between"><span class="font-bold">طريقة الدفع:</span><span>${getPaymentMethodName(pd.paymentMethod || pd.payment_method) || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">المبلغ:</span><span class="text-ksu-green font-bold">${(pd.totalAmount || pd.total_amount || 0).toLocaleString('ar-SA')} ر.س</span></div>
                <div class="flex justify-between"><span class="font-bold">رمز البوابة:</span><span class="font-mono text-xs" dir="ltr">${gatewayToken}</span></div>
                <div class="flex justify-between"><span class="font-bold">رقم المعاملة:</span><span class="font-mono text-xs">${pd.transactionId || pd.transaction_id || '---'}</span></div>
                <div class="flex justify-between"><span class="font-bold">الحالة:</span><span class="badge ${isSubActive ? 'badge-success' : 'badge-warning'}">${isSubActive ? '🟢 اشتراك نشط' : pd.status === 'completed' ? 'مكتمل' : pd.status || 'معلق'}</span></div>
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

async function refreshFromCloud() {
    const btn = document.getElementById('cloudSyncBtn');
    const statusEl = document.getElementById('cloudStatus');
    const liveStatus = document.getElementById('cloudLiveStatus');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ جاري المزامنة...'; }
    if (statusEl) { statusEl.textContent = '⏳ جاري المزامنة...'; statusEl.className = 'text-sm text-yellow-500'; }
    if (liveStatus) liveStatus.textContent = '⏳ جاري المزامنة من السحابة...';

    try {
        const results = await CloudDB.syncAllToLocal();
        AdminEngine.refresh();

        if (btn) { btn.disabled = false; btn.innerHTML = '✓ تمت المزامنة'; setTimeout(() => { btn.innerHTML = '🔄 مزامنة من السحابة'; }, 3000); }
        if (statusEl) {
            const total = Object.values(results).reduce((a, b) => a + (b > 0 ? b : 0), 0);
            statusEl.textContent = `☁️ متصل - ${total} سجل مستورد`;
            statusEl.className = 'text-sm text-ksu-green';
        }
        if (liveStatus) liveStatus.textContent = `☁️ متصل - آخر تحديث ${new Date().toLocaleTimeString('ar-SA')}`;
        Utils.showToast('تمت المزامنة مع السحابة', 'success');
    } catch (e) {
        console.error('Cloud sync failed:', e);
        if (btn) { btn.disabled = false; btn.innerHTML = '❌ فشلت المزامنة'; setTimeout(() => { btn.innerHTML = '🔄 مزامنة من السحابة'; }, 3000); }
        if (statusEl) { statusEl.textContent = '☁️ غير متصل'; statusEl.className = 'text-sm text-red-500'; }
        if (liveStatus) liveStatus.textContent = '⚠️ غير متصل - تعمل البيانات المحلية';
        Utils.showToast('فشلت المزامنة من السحابة - استخدم البيانات المحلية', 'warning');
        AdminEngine.refresh();
    }
}

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

const ADMIN_EMAIL = 'aszxgvhbqw@gmail.com';
const ADMIN_PASSWORD = 'aszxgvhbqw123Q@12SA';
const SESSION_KEY = 'ksu_admin_session';

function isLoggedIn() {
    try {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (session && session.email && session.expires > Date.now()) return true;
    } catch (e) { /* ignore */ }
    return false;
}

function saveSession(token) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        email: ADMIN_EMAIL,
        token: token || '',
        expires: Date.now() + 24 * 60 * 60 * 1000
    }));
}

async function adminLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        saveSession('');
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

document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        document.getElementById('loginOverlay').classList.add('hidden');
        AdminEngine.init();
        switchTab('dashboard');
        setTimeout(() => refreshFromCloud(), 500);
        CloudSync.startAutoRetry(15000);
        setInterval(() => {
            if (typeof refreshFromCloud === 'function') {
                refreshFromCloud();
            }
        }, 15000);
    }
    document.getElementById('loginPassword').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') adminLogin();
    });
    document.getElementById('loginEmail').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('loginPassword').focus();
    });
    console.log('KSU Admin Dashboard loaded with live cloud sync');
});
