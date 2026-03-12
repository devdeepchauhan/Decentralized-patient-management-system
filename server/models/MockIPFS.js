const mongoose = require('mongoose');

const MockIPFSSchema = new mongoose.Schema({
  cid: {
    type: String,
    required: true,
    unique: true
  },
  data: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MockIPFS', MockIPFSSchema);
