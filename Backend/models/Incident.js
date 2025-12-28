const mongoose = require('mongoose');

const incidentSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['Fire', 'Medical', 'Police', 'Accident', 'Other'],
    },
    customType: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Resolved'],
      default: 'Pending',
    },
    notes: [{
      text: String,
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Incident', incidentSchema);
