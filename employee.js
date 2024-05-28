const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const employees = new Schema({
  id:{
    type: Number,
    required: true,
    unique: true,
  },
  emp_name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('employees', employees);