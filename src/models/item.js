const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const itemSchema = new mongoose.Schema({
  productorId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Productor',
    required:true
  },
  productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Product',
    required:true
  },
  quantity:{
    type:Number,
    required:true
  },
  totalPrice:{
    type:Number,
    required:true
  },
  state:{
    type:String,
    required:true
  }
})

const Item = mongoose.model('Item', itemSchema)

module.exports = Item
