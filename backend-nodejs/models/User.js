const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phonenumber: {
    type: String,
    required: false,
    default: '',
  },
  password: {
    type: String,
    required: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  googleId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  profilePic: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  lastUsernameChange: {
    type: Date,
    default: null,
  },
  savedContent: [{
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    contentType: { type: String, enum: ['post', 'short'], required: true },
    savedAt: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('User', userSchema);
