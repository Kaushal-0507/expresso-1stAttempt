import express from 'express';
import { isAdmin } from '../middlewares/adminMiddleware.js';
import { isAuth } from '../middlewares/isAuth.js';
import { getAllUsers, getAllPosts } from '../controllers/adminController.js';
import { debugMiddleware } from '../middlewares/debugMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(debugMiddleware); // Add debug middleware first
router.use(isAuth); // Authenticate all admin routes
router.use(isAdmin); // Verify admin access for all routes

// Get all users
router.get('/users', getAllUsers);

// Get all posts
router.get('/posts', getAllPosts);

export default router;