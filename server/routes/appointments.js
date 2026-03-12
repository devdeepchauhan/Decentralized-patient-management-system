const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { auth, roleCheck } = require('../middleware/auth');

// @route   POST api/appointments
// @desc    Create an appointment
// @access  Private (Staff)
router.post('/', [auth, roleCheck(['STAFF'])], async (req, res) => {
  try {
    const { patientId, doctorId, date, notes } = req.body;

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      date,
      notes
    });

    const appointment = await newAppointment.save();
    
    // Populate for immediate return
    await appointment.populate('patientId', 'name email hashId');
    await appointment.populate('doctorId', 'name email');

    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/appointments
// @desc    Get all appointments
// @access  Private (Staff, Doctor)
router.get('/', auth, async (req, res) => {
  try {
    // If doctor, only see their appointments. If staff, see all.
    let query = {};
    if (req.user.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    } else if (req.user.role === 'PATIENT') {
       // Should patient see their appointments? Let's allow it.
       query.patientId = req.user.id;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email hashId')
      .populate('doctorId', 'name email')
      .sort({ date: 1 });
      
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/appointments/:id/status
// @desc    Update appointment status
// @access  Private (Staff, Doctor)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role === 'PATIENT') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { status } = req.body;
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

    // Assuming doctor can only update their own appointments
    if (req.user.role === 'DOCTOR' && appointment.doctorId.toString() !== req.user.id) {
       return res.status(403).json({ msg: 'Not authorized for this appointment' });
    }

    appointment.status = status;
    await appointment.save();

    await appointment.populate('patientId', 'name email hashId');
    await appointment.populate('doctorId', 'name email');

    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
