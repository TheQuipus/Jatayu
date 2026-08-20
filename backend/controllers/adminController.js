import { Setting } from '../models/index.js';

export const getSettings = async (req, res) => {
  try {
    const dbSettings = await Setting.findAll();
    return res.status(200).json(dbSettings);
  } catch (error) {
    console.error('Get Settings Error:', error);
    return res.status(500).json({ message: 'Server error retrieving settings', error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ message: 'Settings object is required' });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      await Setting.upsert({
        key,
        value: String(value)
      });
    }

    return res.status(200).json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update Settings Error:', error);
    return res.status(500).json({ message: 'Server error updating settings', error: error.message });
  }
};
