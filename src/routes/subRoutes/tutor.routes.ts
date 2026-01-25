import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginValidator, registerValidator } from '../../validators/auth.validators';
import * as TutorController from '../../controllers/tutor.controller';
import { authTutor } from '../../middlewares/auth';

const router = Router();

// Public routes
router.post('/signup', TutorController.tutorSignup);
router.post('/login', loginValidator, TutorController.tutorLogin);

// Protected routes (require tutor auth)
router.get('/profile', authTutor, TutorController.getTutorProfile);
router.post('/update-profile', authTutor, TutorController.updateTutorProfile);

export default router;
