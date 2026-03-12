const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user (Doctor, Patient, Staff)
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, role, walletAddress } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      role: role || 'PATIENT',
      walletAddress
    });

    // Generate unique hashId for PATIENT
    if (user.role === 'PATIENT') {
      const uniqueString = `${user.email}-${Date.now()}`;
      user.hashId = crypto.createHash('sha256').update(uniqueString).digest('hex').substring(0, 16);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, hashId: user.hashId } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, hashId: user.hashId } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/patients/search/:hashId
// @desc    Get patient info by their unique hash
// @access  Private (Doctor)
router.get('/patients/search/:hashId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'DOCTOR') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    const patient = await User.findOne({ hashId: req.params.hashId, role: 'PATIENT' }).select('-password');
    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/doctors
// @desc    Get list of all doctors for appointments
// @access  Private
router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'DOCTOR' }).select('name _id email walletAddress');
    res.json(doctors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/auth/patients
// @desc    Get list of all patients
// @access  Private
router.get('/patients', auth, async (req, res) => {
  try {
    const patients = await User.find({ role: 'PATIENT' }).select('name _id email hashId walletAddress');
    res.json(patients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
