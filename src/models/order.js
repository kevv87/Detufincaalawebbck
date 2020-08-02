const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    limitDate: {
        type: Date,
        required: true,
    },
    consumerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    items:[{  // tal vez sea mejor virtual...
      type: mongoose.Schema.Types.ObjectId,
      ref:'Item',
      required:true
    }]
}, {
    timestamps: true
})

const Order = mongoose.model('Order', orderSchema)

module.exports = Order
