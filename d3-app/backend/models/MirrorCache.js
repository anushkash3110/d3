const mongoose = require("mongoose");

const mirrorCacheSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    analysis: { type: mongoose.Schema.Types.Mixed, required: true },
    generatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MirrorCache", mirrorCacheSchema);
