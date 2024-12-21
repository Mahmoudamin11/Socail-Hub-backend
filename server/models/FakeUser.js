// FakeUser.js

import mongoose from 'mongoose';

const FakeUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  // Add other properties as needed
});

const FakeUser = mongoose.model('FakeUser', FakeUserSchema);

export default FakeUser;
