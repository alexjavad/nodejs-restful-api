const mongoose = require('mongoose');

const surveyResponseSchema = mongoose.Schema({
    survey: {type: mongoose.Schema.Types.ObjectId, ref: 'Survey'},
    responses: Array,
    participant: {type: mongoose.Schema.Types.ObjectId, ref: 'Participant'},
    submission_date: Date
});


module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);