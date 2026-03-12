const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['DOCTOR', 'PATIENT', 'STAFF'],
    default: 'PATIENT',
  },
  walletAddress: {
    type: String, // Used for linking to the blockchain records
    required: false,
  },
  hashId: {
    type: String, // Patient's unique hash code for accessing records
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
