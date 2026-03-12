const express = require('express');
const router = express.Router();
const MockIPFS = require('../models/MockIPFS');
const { auth } = require('../middleware/auth');

// @route   POST api/ipfs/upload
// @desc    Mock upload data to IPFS (stores in DB instead)
// @access  Private (Doctor)
router.post('/upload', auth, async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR') {
      return res.status(403).json({ msg: 'Not authorized to upload records' });
    }
    
    const { cid, data } = req.body;
    
    if(!cid || !data) {
        return res.status(400).json({ msg: 'Missing IPFS CID or Data' });
    }

    const mockRecord = new MockIPFS({ cid, data });
    await mockRecord.save();

    res.json({ success: true, cid });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/ipfs/:cid
// @desc    Mock fetch data from IPFS 
// @access  Private 
router.get('/:cid', auth, async (req, res) => {
  try {
    const record = await MockIPFS.findOne({ cid: req.params.cid });
    
    if (!record) {
      return res.status(404).json({ msg: 'IPFS Document not found on the mock provider' });
    }

    res.json({ data: record.data });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
