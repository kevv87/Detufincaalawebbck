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

const productorSchema = new mongoose.Schema({
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
    stock:
      [{
      price: Number,
      name:String,
      productId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
      }
    }]
    ,
    region:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'Region',
      required:true
    },
    ubicacion:{type:ubicacion,required:true},
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

productorSchema.virtual('products', {  // La idea de que sea virtual es que se popule solo cuando es necesario
    ref: 'Product',
    localField: '_id',
    foreignField: 'owner'
})

productorSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}

productorSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

productorSchema.statics.findByCredentials = async (email, password) => {
    const user = await Productor.findOne({ email })

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
productorSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// Delete user products when user is removed
productorSchema.pre('remove', async function (next) {
    const user = this
    await Product.deleteMany({ owner: user._id })
    next()
})

const Productor = mongoose.model('Productor', productorSchema)

module.exports = Productor
