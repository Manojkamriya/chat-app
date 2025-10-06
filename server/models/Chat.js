const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    senderAvatar: String,
    timestamp: {type: Date, default: Date.now}
})

const Chat = mongoose.model('message', chatSchema)
module.exports = Chat