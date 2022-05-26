const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const usuarioSchema = new Schema({
    nome: { type: String, required: true, lowercase: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true },
    created: { type: Date, default: Date.now }
})
module.exports = mongoose.model('User', usuarioSchema);