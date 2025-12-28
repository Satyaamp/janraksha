const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  addNoteToIncident,
} = require('../controllers/incidentController');

// Multer Configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.route('/')
  .get(getIncidents)
  .post(upload.single('image'), createIncident);

router.route('/:id')
  .put(updateIncident)
  .delete(deleteIncident);

router.route('/:id/notes')
  .post(addNoteToIncident);

module.exports = router;
