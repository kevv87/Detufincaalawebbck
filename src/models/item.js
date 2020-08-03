const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Productor = require('./productor')
const User = require('./user')
const Order = require('./order')

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
  name:{
    type:String,
    required:true
  }
  ,
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  transportId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Transportation',
    required:false
  }
  ,
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
  },
  ignoreProductors:[{
    type:mongoose.Schema.Types.ObjectId,
    required:false
  }]
})

// TODO: Hacer un presave que avise a los productores de alguna manera.
itemSchema.pre('save', async function(next){
  const item = this
  console.log("Avisar a productor:" + item.productorId + " de su nueva orden");

})

itemSchema.pre('delete', async function(next){
  const order = Order.findOne({items:this})
  order.items = order.items.filter(item => String(item)!=String(this._id))
})

itemSchema.methods.reassign = async function(newProductor){
  this.productorId = newProductor._id
  const user = await User.findOne({_id:this.userId})
  const order = await Order.findOne({items:this})
  this.ignoreProductors.push(newProductor._id)
  user.newSupplier(newProductor, order)
}

itemSchema.virtual('requester',{
  ref:'User',
  localField:'userId',
  foreignField:'_id'
})

itemSchema.virtual('provider',{
  ref:'Productor',
  localField:'productorId',
  foreignField:'_id'
})

const Item = mongoose.model('Item', itemSchema)

module.exports = Item
