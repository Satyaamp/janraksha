const Incident = require('../models/Incident');

// @desc    Get all incidents
// @route   GET /api/incidents
const getIncidents = async (req, res, next) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.status(200).json(incidents);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new incident
// @route   POST /api/incidents
const createIncident = async (req, res, next) => {
  try {
    console.log('➡️ Incoming POST Request to /api/incidents');
    console.log('📦 Request Body:', req.body);
    console.log('📂 Request File:', req.file);

    const { type, description, address, severity, customType, latitude, longitude } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    
    // Duplicate Incident Detection
    // Check for same type within ~100m (0.001 deg) and last 30 minutes
    if (latitude && longitude) {
      const timeThreshold = new Date(Date.now() - 30 * 60 * 1000);
      const duplicate = await Incident.findOne({
        type,
        createdAt: { $gte: timeThreshold },
        latitude: { $gte: Number(latitude) - 0.001, $lte: Number(latitude) + 0.001 },
        longitude: { $gte: Number(longitude) - 0.001, $lte: Number(longitude) + 0.001 }
      });

      if (duplicate) {
        console.log('⚠️ Duplicate Incident Detected. Merging...');
        duplicate.notes.push({ text: `System: Duplicate report merged. Description: ${description}` });
        await duplicate.save();
        req.io.emit('incident:update', duplicate);
        return res.status(200).json(duplicate);
      }
    }

    const incident = await Incident.create({
      type,
      customType,
      description,
      address,
      latitude,
      longitude,
      severity,
      imageUrl
    });

    console.log('✅ Incident Saved to DB:', incident);

    // Emit real-time event
    req.io.emit('incident:new', incident);

    res.status(201).json(incident);
  } catch (error) {
    console.error('❌ Error creating incident:', error);
    next(error);
  }
};

// @desc    Update incident status
// @route   PUT /api/incidents/:id
const updateIncident = async (req, res, next) => {
  try {
    const { status } = req.body;
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!incident) {
      res.status(404);
      throw new Error('Incident not found');
    }

    // Emit real-time event
    req.io.emit('incident:update', incident);

    res.status(200).json(incident);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
const deleteIncident = async (req, res, next) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      res.status(404);
      throw new Error('Incident not found');
    }

    await Incident.findByIdAndDelete(req.params.id);

    // Emit real-time event
    req.io.emit('incident:delete', req.params.id);

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Add note to incident
// @route   POST /api/incidents/:id/notes
const addNoteToIncident = async (req, res, next) => {
  try {
    const { text } = req.body;
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      res.status(404);
      throw new Error('Incident not found');
    }

    incident.notes.push({ text });
    await incident.save();

    // Emit real-time event
    req.io.emit('incident:update', incident);

    res.status(200).json(incident);
  } catch (error) {
    next(error);
  }
};

module.exports = { getIncidents, createIncident, updateIncident, deleteIncident, addNoteToIncident };
