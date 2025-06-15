const mongoose = require('mongoose');
const profileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String, // You can store filename or path here
        required: true
    },
    family: {
        type: String,
        enum: ['1', '2', '3', '4+'],
        required: true
    },
    room: {
        type: Number,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    doj: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model('Profile', profileSchema);