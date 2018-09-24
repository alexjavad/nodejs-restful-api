const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { buildCheckFunction, validationResult } = require('express-validator/check');
const check = buildCheckFunction(['body', 'query']);
var moment = require('moment-timezone');

const Survey = require("../models/survey");
const SurveyResponse = require("../models/survey_response");
const Participant = require("../models/participant");


//STANDARD RESTful Routes (GET, POST, PUT, DELETE)

router.get("/", (req, res, next) => {
  Survey.find()
    .exec()
    .then(docs => {
      console.log(docs);
      if (docs.length >= 0) {
      res.status(200).json(docs);
        } else {
            res.status(404).json({
                message: 'No entries found'
            });
        }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


router.post("/", [
    check('SurveyName').exists().withMessage('must supply a \'SurveyName\'').isString().withMessage('must be a string'),
    check('Questions').isArray().withMessage('please provide an array of \'Questions\' for the Survey'),
    check('Questions.*.*', 'Question objects must contain valid strings').isString(),
    check('Frequency', 'Frequency must be either \'weekly\' or \'daily\'').isIn(['weekly', 'daily']),
    check('LaunchTime', 'LaunchTime must be in ISO 8601 format').isISO8601(),
    check('DueTime', 'DueTime must be in ISO 8601 format').isISO8601()
  ], (req, res, next) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
     const survey = new Survey({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.SurveyName,
        questions: req.body.Questions,
        frequency: req.body.Frequency,
        launch_time: moment.utc(req.body.LaunchTime).format(),
        due_time: moment.utc(req.body.DueTime).format()
    });
    survey
      .save()
      .then(result => {
        console.log(result);
        res.status(201).json({
          message: "Handling POST requests to /Surveys",
          createdSurvey: result
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
});

router.get("/:SurveyId", (req, res, next) => {
  const id = req.params.SurveyId;
  Survey.findById(id)
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json(doc);
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided ID" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

router.get("/:SurveyName", (req, res, next) => {
  const name = req.params.SurveyName;
  Survey.find({ name: name})
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json(doc);
      } else {
        res
          .status(404)
          .json({ message: "No valid entry found for provided SurveyName" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

router.put("/:SurveyId", (req, res, next) => {
    const id = req.params.SurveyId; 
    const updateOps = {};
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
    Survey.update({ _id: id }, { $set: updateOps })
      .exec()
      .then(result => {
        console.log(result);
        res.status(200).json(result);
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
});

router.delete("/:SurveyId", (req, res, next) => {
  const id = req.params.SurveyId;
  Survey.remove({ _id: id })
    .exec()
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});


//Koneksa Specific APIs

router.post("/:SurveyId/responses",
    [
      check('Questions').isArray().withMessage('please provide an array of \'Questions\' in the HTTP request body for the Survey'),
      check('Questions.*.*', 'Question objects must contain valid strings').isString(),
      check('ParticipantID', 'Must supply a Participant \'ID\'').isString()
    ]
  , (req, res, next) => {
  //will need user info stored in localStorage/cookie after a participant "Logs in" via login API
  //submitting as a paramater in the HTTP request body for the purpose of this exercise.
  const id = req.body.ParticipantID;
  Participant.findOne({ID: id})
    .exec()
    .then(participant => {
      if (participant) {
        Survey.findOne({_id: req.params.SurveyId})
        .exec()
        .then(survey => {       
           
          //determine last response for this user for the specific survey
          //don't insert if there exists a response for the survey, from this user, on this day/week
          
          //### just a rough idea ###
          // if(survey.frequency == "weekly") {

          // } else if(survey.frequency == "daily") {
          //   SurveyResponse.find({participant: participant._id, survey: survey._id, submission_date = moment.tz(participant.timezone)})
          //   .exec()
          //   .then(response => {
          //     if(response) {
          //       console.log(response);
          //     }
          //   });
          // } else {

          // }
          
          const survey_response = new SurveyResponse({
            survey: survey._id,
            responses: req.body.Questions,
            participant: participant._id,
            submission_date: moment.tz(participant.timezone)
          });
    
          survey_response
          .save()
          .then(result => {
            console.log(result);
            res.status(201).json({
              message: "Handling POST requests to /Surveys/:SurveyId/responses",
              createdSurveyResponse: result
            });
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });

          })
        .catch(err => {
                console.log(err);
                res.status(500).json({
                error: err
                });
          });
      } else {
        res.status(404).json({ message: "No valid entry found for provided Participant ID" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
  
});


module.exports = router;
