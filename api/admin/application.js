// POST /api/admin/application — Update application status (approve/reject)
const { getServiceClient, ok, fail } = require('./../_supabase.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const supabase = getServiceClient();
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', tokenData.id)
      .eq('email', tokenData.email)
      .maybeSingle();
    if (!admin) return res.status(401).json({ error: 'Session expired' });
    const { applicationId, status } = req.body || {};
    if (!applicationId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'applicationId and status (approved/rejected) required' });
    }
    const { data, error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ success: true, application: data });
  } catch (err) {
    console.error('Admin application update error:', err);
    return res.status(500).json({ error: 'فشل تحديث الطلب.' });
  }
};
