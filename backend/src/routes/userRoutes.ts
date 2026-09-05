import { Router } from 'express';
import { UserController } from '../controllers/userController.js';

export const userRoutes = Router();

userRoutes.get('/profile', UserController.getProfile);
userRoutes.put('/profile', UserController.updateProfile);
