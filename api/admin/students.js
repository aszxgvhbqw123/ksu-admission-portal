// GET /api/admin/students — Get all students with academic records, applications, subscriptions
// Requires x-admin-token header
const { getServiceClient, ok, fail } = require('./../_supabase.js');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    // Verify admin token
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const supabase = getServiceClient();
    // Verify token is still valid
    const { data: admin, error: adminErr } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', tokenData.id)
      .eq('email', tokenData.email)
      .maybeSingle();
    if (adminErr || !admin) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    // Fetch all profiles with related data
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (profilesErr) throw profilesErr;
    // Fetch all related records
    const userIds = profiles.map(p => p.id);
    if (userIds.length === 0) return res.status(200).json({ students: [] });
    const [academicRes, appRes, subRes] = await Promise.all([
      supabase.from('academic_records').select('*').in('user_id', userIds),
      supabase.from('applications').select('*').in('user_id', userIds),
      supabase.from('subscriptions').select('*').in('user_id', userIds)
    ]);
    // Build index maps
    const academicMap = {};
    (academicRes.data || []).forEach(r => { academicMap[r.user_id] = r; });
    const appMap = {};
    (appRes.data || []).forEach(r => {
      if (!appMap[r.user_id]) appMap[r.user_id] = [];
      appMap[r.user_id].push(r);
    });
    const subMap = {};
    (subRes.data || []).forEach(r => { subMap[r.user_id] = r; });
    // Compose response
    const students = profiles.map(p => ({
      ...p,
      academic: academicMap[p.id] || null,
      applications: appMap[p.id] || [],
      subscription: subMap[p.id] || null
    }));
    return res.status(200).json({ students, total: students.length });
  } catch (err) {
    console.error('Admin students error:', err);
    return res.status(500).json({ error: 'فشل تحميل بيانات الطلاب.' });
  }
};
