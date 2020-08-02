const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Product = require('./product')

const ubicacion = new mongoose.Schema({
  Easting:{
    type:Number,
    required:true
  },
  Northing:{
    type:Number,
    required:true
  },
  ZoneNumber:{
    type:Number,
    required:true
  },
  ZoneLetter:{
    type:String,
    required:true
  }
})

const transportationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    lastname:{
      type: String,
      required: true,
      trim: true
    },
    email:{
      type:String,
      unique:true,
      required:true,
      trim:true
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    role:{
      type:String,
      required:true
    },
    phone:{
      type:String,
      required:true
    }
    ,
    region:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Region',
      required:true
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

transportationSchema.virtual('entregas',{
  ref:'Item',
  foreignField:'transportId',
  localField:'_id'
})

transportationSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

transportationSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

transportationSchema.statics.findByCredentials = async (email, password) => {
    const user = await Productor.findOne({email})

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// Hash the plain text password before saving
transportationSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const Transportation = mongoose.model('Transportation', transportationSchema)

module.exports = Transportation
