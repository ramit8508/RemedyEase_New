
import mongoose from "mongoose";

const TimeslotSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  date: { type: String, required: true }, // e.g. '2025-11-01'
  slots: [
    {
      time: { type: String, required: true }, // e.g. '10:00 AM - 10:30 AM'
      booked: { type: Boolean, default: false },
      bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    }
  ]
});

export const Timeslot = mongoose.model('Timeslot', TimeslotSchema);