const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  title: String,
  start: Date,
  end: Date,
  allDay: Boolean,
  resourceId: String,
});

module.exports = mongoose.model("Event", eventSchema);
