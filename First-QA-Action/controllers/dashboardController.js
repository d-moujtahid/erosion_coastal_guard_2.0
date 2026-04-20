// controllers/dashboardController.js
const model = require('../models/dashboardModel');

const getSummary = async (req, res) => {
  try {
    const data = await model.getSummary();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[dashboardController.getSummary]', err.message);
    return res.status(500).json({ success: false, message: 'Erreur agrégation dashboard.' });
  }
};

module.exports = { getSummary };
