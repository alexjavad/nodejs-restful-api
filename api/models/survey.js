const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const surveySchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: { type : String , unique : true, required : true },
    questions: Array,
    frequency: String,
    launch_time: Date,
    due_time: Date
});

surveySchema.plugin(uniqueValidator);

module.exports = mongoose.model('Survey', surveySchema);