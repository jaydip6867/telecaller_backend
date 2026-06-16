const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
  note: String,

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    std: {
      type: String,
      required: true
    },

    mobileNumber: {
      type: String,
      required: true
    },

    schoolCollege: {
      type: String,
      required: true
    },

    tution: {
      type: String,
      required: true,
      default: null
    },

    followUpDate: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: [
        "pending",
        "visited",
        "in_calling",
        "admission",
        "decline"
      ],
      default: "pending"
    },

    notes: [noteSchema]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Inquiry", inquirySchema);