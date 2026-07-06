const { getServiceClient, ok, fail } = require('./_supabase.js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, preferences, totalAmount } = req.body || {};
    if (!userId || !Array.isArray(preferences)) {
      return res.status(400).json({ error: 'userId and preferences array required' });
    }
    const supabase = getServiceClient();

    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const prefText = JSON.stringify(preferences.map(p => ({
      collegeName: p.collegeName || p.name || '',
      collegeId: p.collegeId || p.id || '',
      trackType: p.trackType || '',
      order: p.order || 0
    })));

    const payload = {
      user_id: userId,
      preferences: prefText,
      total_amount: totalAmount || 0,
      status: 'pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      result = await supabase.from('applications').update(payload).eq('user_id', userId).select().single();
    } else {
      result = await supabase.from('applications').insert(payload).select().single();
    }
    if (result.error) throw result.error;
    return res.status(200).json({ success: true, application: result.data });
  } catch (err) {
    console.error('Preferences POST error:', err);
    return res.status(500).json({ error: 'فشل حفظ الرغبات. حاول مرة أخرى.' });
  }
};
