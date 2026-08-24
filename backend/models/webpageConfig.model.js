const mongoose = require("mongoose");

const webpageConfigSchema = new mongoose.Schema(
  {
    heroBanners: [
      {
        contentType: {
          type: String,
          enum: ["Movie", "Series"],
          required: true
        },
        // NOTE: No refPath here — population is done manually in the controller
        // using explicit { model } option to handle the mixed Movie/Series case.
        contentId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        }
      }
    ],
    sections: [
      {
        categorySlug: {
          type: String,
          required: true
        },
        title: {
          type: String,
          required: true
        },
        items: [
          {
            contentType: {
              type: String,
              enum: ["Movie", "Series"],
              required: true
            },
            // NOTE: No refPath here — population is done manually in the controller.
            contentId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true
            }
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("WebpageConfig", webpageConfigSchema);