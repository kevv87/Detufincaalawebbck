const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    },
    name:{
      type:String,
      required: true
    },
    price: {
        type: Number,
        default: false,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Product = mongoose.model('Product', taskSchema)

module.exports = Product
