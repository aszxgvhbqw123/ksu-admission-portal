// POST /api/subscription — Confirm payment subscription & store token
// GET  /api/subscription?id=xxx — Retrieve subscription status
const { getServiceClient, ok, fail } = require('./_supabase.js');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'User ID required' });
      const supabase = getServiceClient();
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      if (error) throw error;
      return res.status(200).json(data || null);
    } catch (err) {
      console.error('Subscription GET error:', err);
      return res.status(500).json({ error: 'فشل تحميل بيانات الاشتراك.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { userId, gatewayToken, maskedCard, cardholderName, paymentMethod, totalAmount, transactionId } = req.body || {};
      if (!userId || !gatewayToken) {
        return res.status(400).json({ error: 'userId and gatewayToken are required' });
      }
      const supabase = getServiceClient();
      const payload = {
        user_id: userId,
        gateway_token: gatewayToken,
        masked_card: maskedCard || '',
        cardholder_name: cardholderName || '',
        payment_method: paymentMethod || 'mada',
        total_amount: totalAmount || 0,
        transaction_id: transactionId || '',
        billing_status: 'active',
        next_payment_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      let result;
      if (existing) {
        result = await supabase.from('subscriptions').update(payload).eq('user_id', userId).select().single();
      } else {
        result = await supabase.from('subscriptions').insert(payload).select().single();
      }
      if (result.error) throw result.error;
      return res.status(200).json({ success: true, subscription: result.data });
    } catch (err) {
      console.error('Subscription POST error:', err);
      return res.status(500).json({ error: 'فشل تأكيد الدفع. حاول مرة أخرى.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
