const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Product = require('./product')
const Productor = require('./productor')
const Order = require('./order')

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

const userSchema = new mongoose.Schema({
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
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    role:{
      type:String,
      required:true
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
    region:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Region',
      required:true
    },
    location:ubicacion,
    telephone:{
      type: String,
      required: true,
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

userSchema.virtual('orders', {
    ref: 'Order',
    localField: '_id',
    foreignField: 'consumerId'
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

userSchema.methods.newSupplier = async function(newProductor, order) {
  console.log("Nuevo productor!" + newProductor.name + " para orden "+ order._id);
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    //console.log(user);
    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user products when user is removed
userSchema.pre('remove', async function (next) {
    const user = this
    await Product.deleteMany({ owner: user._id })
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
