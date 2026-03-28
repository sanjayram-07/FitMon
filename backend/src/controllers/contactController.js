const { admin, getDb } = require('../firebase/admin');

function isValidEmail(email) {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

async function submitContact(req, res) {
  try {
    const { name, email, organization, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({
        message: 'Name, email, and message are required.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
      });
    }

    const payload = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      organization: organization ? String(organization).trim() : null,
      message: String(message).trim(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'landing',
      userAgent: req.get('user-agent') || null,
      ip: req.ip || null,
    };

    const docRef = await getDb().collection('contactMessages').add(payload);

    return res.status(201).json({
      ok: true,
      id: docRef.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to submit contact request.',
      details: error.message,
    });
  }
}

module.exports = { submitContact };
