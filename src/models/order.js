const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
    state: {
        type: String,
        required: true,
    },
    limitDate: {
        type: Date,
        required: true,
    },
    consumerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Consumer'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    items:[{
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
    }]
}, {
    timestamps: true
})

const Item = mongoose.model('Item', taskSchema)

module.exports = Product
