import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { loginValidator, registerValidator } from '@/validators/auth.validators';
import * as AuthController from '@/controllers/auth.controller';
import { authAdminOrUser } from '@/middlewares/auth';

const router = Router();

router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);

export default router;

