// ownerModel.js
import mongoose from 'mongoose';

const ownerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  email: {
    type: String,
    required: true,
    unique: true,
},
password: {
    type: String,
    required: true,
    min: 6,
}

});

const Owner = mongoose.model('Owner', ownerSchema);

export default Owner;
