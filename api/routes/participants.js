const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { buildCheckFunction, validationResult } = require('express-validator/check');
const check = buildCheckFunction(['body', 'query']);
var moment = require('moment-timezone');

const Participant = require("../models/participant");
const Survey = require("../models/survey");


//STANDARD RESTful Routes (GET, POST, PUT, DELETE)

router.get("/", (req, res, next) => {
  Participant.find()
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


router.post("/", (req, res, next) => {

    if(!!moment.tz.zone(req.body.Timezone) == false) {
        res.status(400).json({
            error: "The Timezone provided is invalid. Please supply one of the following Timezones: " + moment.tz.names(),
        });
    } else {
        const participant = new Participant({
            ID: req.body.ID,
            timezone: req.body.Timezone
        });
    
        participant
          .save()
          .then(result => {
            console.log(result);
            res.status(201).json({
              message: "Handling POST requests to /Participants",
              createdParticipant: result
            });
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });
    }
});

router.get("/:ParticipantId", (req, res, next) => {
  const id = req.params.ParticipantId;
  Participant.findById(id)
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

router.put("/:ParticipantId", [

  ], (req, res, next) => {
    const id = req.params.ParticipantId;
    const updateOps = {};
    for (const ops of req.body) {
      updateOps[ops.propName] = ops.value;
    }
    Participant.update({ _id: id }, { $set: updateOps })
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

router.delete("/:ParticipantId", (req, res, next) => {
  const id = req.params.ParticipantId;
  Participant.remove({ _id: id })
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
router.get("/:ID/available-surveys", (req, res, next) => {
  const id = req.params.ID;
  Participant.findOne({ID: id})
    .exec()
    .then(doc => {
      console.log("Participant: ", doc);
      if (doc) {
        //get all surveys
        Survey.find().exec()
        .then(docs => {
          if (docs.length >= 0) {            
            //filter surveys based on if this partcipant's time falls within launchtime and duetime of the survey
            var available_surveys = docs.filter(s =>  {
                                              return ((moment(s.launch_time).utc().format("HH:mm") <= moment().tz(doc.timezone).format("HH:mm")) 
                                                    && (moment().tz(doc.timezone).format("HH:mm") <= moment(s.due_time).utc().format("HH:mm")));
                                                });

            res.status(200).json(available_surveys);

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
      } else {
        res.status(404).json({ message: "No valid entry found for provided Participant 'ID'" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});


module.exports = router;
