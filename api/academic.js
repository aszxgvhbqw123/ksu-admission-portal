// POST /api/academic — Save academic records
// GET  /api/academic?id=xxx — Retrieve academic records for a user
const { getServiceClient, ok, fail } = require('./_supabase.js');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'User ID required' });
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('academic_records')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || {});
    } catch (err) {
      console.error('Academic GET error:', err);
      return res.status(500).json({ error: 'فشل تحميل البيانات الأكاديمية.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, highSchoolGpa, quduratScore, tahsiliScore, weightedAverage, highSchoolType, graduationYear } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const supabase = getServiceClient();
      const payload = {
        user_id: userId,
        high_school_gpa: highSchoolGpa || 0,
        qudurat_score: quduratScore || 0,
        tahsili_score: tahsiliScore || 0,
        weighted_average: weightedAverage || 0,
        high_school_type: highSchoolType || 'scientific',
        graduation_year: graduationYear || '',
        updated_at: new Date().toISOString()
      };
      // Upsert: one academic record per user
      const { data: existing } = await supabase
        .from('academic_records')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      let result;
      if (existing) {
        result = await supabase.from('academic_records').update(payload).eq('user_id', userId).select().single();
      } else {
        result = await supabase.from('academic_records').insert(payload).select().single();
      }
      if (result.error) throw result.error;
      return res.status(200).json({ success: true, academic: result.data });
    } catch (err) {
      console.error('Academic POST error:', err);
      return res.status(500).json({ error: 'فشل حفظ البيانات الأكاديمية.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
