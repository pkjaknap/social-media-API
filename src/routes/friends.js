const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Send friend request
router.post("/request", authMiddleware, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(senderId) ||
      !mongoose.Types.ObjectId.isValid(receiverId)
    ) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Check if sending to self
    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already friends
    if (sender.friends?.includes(receiverId)) {
      return res.status(400).json({ error: "Users are already friends" });
    }

    // Check for existing request
    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already exists" });
    }

    const friendRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
    });

    await friendRequest.save();
    res.status(201).json({
      message: "Friend request sent",
      requestId: friendRequest._id,
    });
  } catch (error) {
    console.error("Send friend request error:", error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

// Handle friend request (accept/reject)
// router.put('/request/:requestId', authMiddleware, async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { requestId } = req.params;
//     const { status } = req.body;
//     const userId = req.user.id;

//     // Validate request ID
//     if (!mongoose.Types.ObjectId.isValid(requestId)) {
//       return res.status(400).json({ error: 'Invalid request ID' });
//     }

//     // Validate status
//     if (!['accepted', 'rejected'].includes(status)) {
//       return res.status(400).json({ error: 'Invalid status. Must be "accepted" or "rejected"' });
//     }

//     // Find request with validation
//     const request = await FriendRequest.findOne({
//       _id: requestId,
//       receiver: userId,
//       status: 'pending'
//     }).session(session);

//     if (!request) {
//       await session.abortTransaction();
//       return res.status(404).json({ error: 'Friend request not found or already processed' });
//     }

//     // Update request status
//     request.status = status;
//     await request.save({ session });

//     if (status === 'accepted') {
//       // Verify both users still exist
//       const [sender, receiver] = await Promise.all([
//         User.findById(request.sender).session(session),
//         User.findById(request.receiver).session(session)
//       ]);

//       if (!sender || !receiver) {
//         await session.abortTransaction();
//         return res.status(404).json({ error: 'One or both users no longer exist' });
//       }

//       // Add users to each other's friends lists
//       await Promise.all([
//         User.findByIdAndUpdate(
//           request.sender,
//           { $addToSet: { friends: request.receiver } },
//           { session, new: true }
//         ),
//         User.findByIdAndUpdate(
//           request.receiver,
//           { $addToSet: { friends: request.sender } },
//           { session, new: true }
//         )
//       ]);
//     }

//     await session.commitTransaction();
//     res.json({
//       message: `Friend request ${status}`,
//       requestId: request._id
//     });
//   } catch (error) {
//     await session.abortTransaction();
//     console.error('Handle friend request error:', error);
//     res.status(500).json({ error: 'Failed to process friend request' });
//   } finally {
//     session.endSession();
//   }
// });

router.put("/request/:requestId", authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate request ID
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ error: "Invalid request ID" });
    }

    // Validate status
    if (!["accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ error: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    // Find and update request
    const request = await FriendRequest.findOne({
      _id: requestId,
      receiver: userId,
      status: "pending",
    });

    if (!request) {
      return res
        .status(404)
        .json({ error: "Friend request not found or already processed" });
    }

    request.status = status;
    await request.save();

    if (status === "accepted") {
      // Add users to each other's friends lists
      await Promise.all([
        User.findByIdAndUpdate(request.sender, {
          $addToSet: { friends: request.receiver },
        }),
        User.findByIdAndUpdate(request.receiver, {
          $addToSet: { friends: request.sender },
        }),
      ]);
    }

    res.json({
      message: `Friend request ${status}`,
      requestId: request._id,
    });
  } catch (error) {
    console.error("Handle friend request error:", error);
    res.status(500).json({ error: "Failed to process friend request" });
  }
});

// Get pending friend requests
router.get("/requests", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await FriendRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "pending",
    })
      .populate("sender", "username email")
      .populate("receiver", "username email")
      .sort({ createdAt: -1 });

    res.json({
      sent: requests.filter((req) => req.sender._id.toString() === userId),
      received: requests.filter(
        (req) => req.receiver._id.toString() === userId
      ),
    });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({ error: "Failed to fetch friend requests" });
  }
});

module.exports = router;
