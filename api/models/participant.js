const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const participantSchema = mongoose.Schema({
    ID: { type : String , unique : true, required : true },
    timezone: { type : String , required : true }
});

participantSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Participant', participantSchema);