const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
    limitDate: {
        type: Date,
        required: true,
    },
    consumerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    items:[{
      type: mongoose.Schema.Types.ObjectId,
      ref:'Item',
      required:true  
    }]
}, {
    timestamps: true
})

const Item = mongoose.model('Item', taskSchema)

module.exports = Product
