const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequestModel = require("../models/connectionRequest");

const router = express.Router();

// Cosine Similarity Function
const cosineSimilarity = (vecA, vecB) => {
  let dot = 0,
    magA = 0,
    magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] ** 2;
    magB += vecB[i] ** 2;
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// GET /api/smart-matches
router.get("/smart-matches", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    const allUsers = await User.find({ _id: { $ne: req.user._id } });

    // Remove already connected users
    const connections = await ConnectionRequestModel.find({
      $or: [
        { fromUserId: req.user._id, status: "accepted" },
        { toUserId: req.user._id, status: "accepted" },
      ],
    });

    const connectedIds = new Set(
      connections.map((c) =>
        c.fromUserId.toString() === req.user._id.toString()
          ? c.toUserId.toString()
          : c.fromUserId.toString()
      )
    );

    // Create skill universe
    const skillSet = new Set();
    allUsers.forEach((u) =>
      (u.skills || []).forEach((s) => skillSet.add(s.toLowerCase()))
    );
    (currentUser.skills || []).forEach((s) => skillSet.add(s.toLowerCase()));

    const skillList = [...skillSet];

    const currentSkills = (currentUser.skills || []).map((s) =>
      s.toLowerCase()
    );

    const userVector = skillList.map((s) =>
      currentSkills.includes(s) ? 1 : 0
    );

    const suggestions = [];

    for (const otherUser of allUsers) {
      if (connectedIds.has(otherUser._id.toString())) continue;

      const otherSkills = (otherUser.skills || []).map((s) => s.toLowerCase());
      const otherVector = skillList.map((s) =>
        otherSkills.includes(s) ? 1 : 0
      );
            

      const similarity = cosineSimilarity(userVector, otherVector);

      if (similarity > 0) {
        suggestions.push({ user: otherUser, similarity });
      }
    }

    suggestions.sort((a, b) => b.similarity - a.similarity);
    const paginated = suggestions.slice(skip, skip + limit);

    res.json({
      matches: paginated,
      total: suggestions.length,
      page,
      totalPages: Math.ceil(suggestions.length / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Smart match error" });
  }
});

module.exports = router;
