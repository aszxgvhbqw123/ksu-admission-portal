// POST /api/signup — Register a new student profile
const { getServiceClient, ok, fail } = require('./_supabase.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { fullName, nationalId, phone, email, nationality, fullNameEn } = req.body || {};
    if (!fullName || !nationalId) {
      return res.status(400).json({ error: 'fullName and nationalId are required' });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        full_name: fullName,
        full_name_en: fullNameEn || '',
        national_id: nationalId,
        phone: phone || '',
        email: email || '',
        nationality: nationality || 'saudi'
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json({ success: true, user: data });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'رقم الهوية مسجل مسبقاً' });
    }
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'فشل تسجيل البيانات. حاول مرة أخرى.' });
  }
};
