const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userFriends = user.friends || [];

    // Find posts from friends or with friends' comments
    const feed = await Post.find({
      $or: [
        { author: { $in: userFriends } },
        { 'comments.author': { $in: userFriends } }
      ]
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'author',
      select: 'username'
    })
    .populate({
      path: 'comments.author',
      select: 'username'
    });

    // Annotate posts with visibility reason
    const annotatedFeed = feed.map((post) => {
      const postObject = post.toObject();
      postObject.visibleReason = {
        isFriendPost: userFriends.includes(post.author._id.toString()),
        hasFriendComment: post.comments.some((comment) => 
          userFriends.includes(comment.author._id.toString())
        )
      };
      return postObject;
    });

    res.json({ posts: annotatedFeed });
  } catch (error) {
    console.error('Feed retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve feed' });
  }
});

module.exports = router;