const mongoose = require('mongoose')
function Connection() {
    const MONGOURI = process.env.MONGODB_URI || process.env.MONGOURI
    if (!MONGOURI) {
        console.log("MongoDB URI not found in environment variables")
        return
    }
    mongoose.connect(MONGOURI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch(err => console.log("MongoDB connection error:", err))
}

module.exports = Connection