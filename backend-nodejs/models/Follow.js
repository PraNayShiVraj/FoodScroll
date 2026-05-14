const mongoose = require('mongoose');

const UserFollowSchema = new mongoose.Schema({
  // The _id will be the User's MongoDB _id
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('UserFollow', UserFollowSchema);
