const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    }
}, {
    timestamps: true
})

const Item = mongoose.model('Item', taskSchema)

module.exports = Product
