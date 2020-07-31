// getting-started.js
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/product-manager-api', {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));


const consumerSchema = new mongoose.Schema({
    name: String
});

const Consumer = mongoose.model('Consumer', consumerSchema);

const consumer = new Consumer({ name: 'Silence' });

consumer.save();

console.log("holaa34234")

