import { User } from '../models/userModel.js';
import { Post } from '../models/postModel.js';

// Get all users with their details
export const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users for admin...');
    const users = await User.find()
      .select('-password')
      .populate('followers')
      .populate('followings');

    console.log(`Successfully fetched ${users.length} users`);
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get all posts with their details
export const getAllPosts = async (req, res) => {
  try {
    console.log('Fetching all posts for admin...');
    const posts = await Post.find()
      .populate({
        path: 'owner',
        select: 'username firstName lastName profileImg email role isActive'
      })
      .populate({
        path: 'likes',
        select: 'username firstName lastName profileImg'
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'username firstName lastName profileImg'
        }
      })
      .sort({ createdAt: -1 });

    console.log(`Successfully fetched ${posts.length} posts`);

    // Transform the posts to match the frontend expectations
    const transformedPosts = posts.map(post => {
      console.log('Processing post:', post._id);
      return {
        _id: post._id,
        content: post.content,
        mediaUrl: post.post?.url || null, // Handle the nested post.url structure
        owner: post.owner,
        likes: post.likes || [],
        comments: post.comments || [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      posts: transformedPosts
    });
  } catch (error) {
    console.error('Get all posts error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
};