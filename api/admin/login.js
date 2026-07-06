// POST /api/admin/login — Authenticate admin user
const { getServiceClient, ok, fail } = require('./../_supabase.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase().trim())
      .eq('password_hash', password)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }
    return res.status(200).json({
      success: true,
      admin: { id: data.id, email: data.email, name: data.full_name },
      token: Buffer.from(JSON.stringify({ id: data.id, email: data.email, t: Date.now() })).toString('base64')
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'فشل تسجيل الدخول. حاول مرة أخرى.' });
  }
};
