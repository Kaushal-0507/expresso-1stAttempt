import { Post } from "../models/postModel.js";
import TryCatch from "../utils/TryCatch.js";
import getDataUrl from "../utils/urlGenerator.js";
import cloudinary from "cloudinary";
import { createNotification } from "../services/notificationService.js";

export const newPost = TryCatch(async (req, res) => {
  console.log(req.body)
  const { content, media } = req.body;

  const ownerId = req.user._id;

  const post = { content, owner: ownerId }

  if (media) post.post = {
    id: media?.id,
    url: media?.url,
  }

  await Post.create(post);

  // Fetch all posts after creating a new one
  const posts = await Post.find().sort({ createdAt: -1 });

  res.status(201).json({
    message: "Post created",
    posts, // Return an array of posts
  });
});

export const deletePost = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({
      message: "No post with this id",
    });

  if (post.owner.toString() !== req.user._id.toString())
    return res.status(403).json({
      message: "Unauthorized",
    });

  await cloudinary.v2.uploader.destroy(post.post.id);

  await post.deleteOne();

  const remainingPosts = await Post.find({});

  res.json({
    message: "Post Deleted",
    posts: remainingPosts
  });
});

export const getAllPosts = TryCatch(async (req, res) => {
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .populate("owner", "-password")
    .populate({
      path: "comments.user",
      select: "-password",
    });

  res.json({ posts });
});

export const getAllUserPosts = TryCatch(async (req, res) => {
  const { id } = req.params;
  const posts = await Post.find({ owner: id })
  .sort({ createdAt: -1 })
  .populate("owner", "-password")
  .populate({
    path: "comments.user",
    select: "-password",
  })
  res.status(200).json({posts});
});

export const likeUnlikePost = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({
      message: "No Post with this id",
    });

  if (post.likes.includes(req.user._id)) {
    const index = post.likes.indexOf(req.user._id);
    post.likes.splice(index, 1);
    await post.save();

    const newPosts = await Post.find({}).populate("owner", "-password");
    res.json({
      message: "Post Unlike",
      posts: newPosts
    });
  } else {
    post.likes.push(req.user._id);
    await post.save();

    // Create notification for like
    if (post.owner.toString() !== req.user._id.toString()) {
      await createNotification(post.owner, req.user._id, "like", post._id);
    }

    const newPosts = await Post.find({}).populate("owner", "-password");
    res.json({
      message: "Post liked",
      posts: newPosts
    });
  }
});

export const commentOnPost = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({
      message: "No Post with this id",
    });

  post.comments.push({
    user: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    comment: req.body.commentData.content,
  });

  await post.save();

  // Create notification for comment
  if (post.owner.toString() !== req.user._id.toString()) {
    await createNotification(
      post.owner,
      req.user._id,
      "comment",
      post._id,
      req.body.commentData.content
    );
  }

  const newPosts = await Post.find({}).populate("owner", "-password");
  res.json({
    message: "Comment Added",
    posts: newPosts
  });
});

export const deleteComment = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({
      message: "No Post with this id",
    });

  if (!req.query.commentId)
    return res.status(404).json({
      message: "Please give comment id",
    });

  const commentIndex = post.comments.findIndex(
    (item) => item._id.toString() === req.query.commentId.toString()
  );

  if (commentIndex === -1) {
    return res.status(400).json({
      message: "Comment not found",
    });
  }

  const comment = post.comments[commentIndex];

  console.log(post.owner.toString(), req.user._id.toString(),
  comment.user.toString(), req.user._id.toString())

  if (
    post.owner.toString() === req.user._id.toString() ||
    comment.user.toString() === req.user._id.toString()
  ) {
    post.comments.splice(commentIndex, 1);

    await post.save();

    const newPosts = await Post.find({}).populate("owner", "-password")

    return res.json({
      message: "Comment deleted",
      posts: newPosts
    });
  } else {
    return res.status(400).json({
      message: "You are not allowed to delete this comment",
    });
  }
});

export const editCaption = TryCatch(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post)
    return res.status(404).json({
      message: "No Post with this id",
    });

  if (post.owner.toString() !== req.user._id.toString())
    return res.status(403).json({
      message: "You are not owner of this post",
    });

  post.content = req.body.content;

  await post.save();

  const newPosts = await Post.find({}).populate("owner", "-password")

  res.json({
    message: "post updated",
    posts: newPosts
  });
});

export const getSinglePost = TryCatch(async (req, res) => {
  const postId = req.params.postId; // Get the post ID from the request parameters

  // Find the post by its ID
  const post = await Post.findById(postId)
    .populate("owner", "-password") // Populate the owner field (excluding password)
    .populate({
      path: "comments.user", // Populate the user field in comments (excluding password)
      select: "-password",
    });

  // If no post is found, return a 404 error
  if (!post) {
    return res.status(404).json({
      message: "No post found with this ID",
    });
  }

  // Return the post in the response
  res.json({ post });
});