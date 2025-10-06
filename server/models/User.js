const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    avatar: String,
    socketId: String,
    online: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)
module.exports = User
