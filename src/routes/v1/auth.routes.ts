import { Router } from 'express';
import { validateRequest } from '@/middlewares/validateRequest';
import { loginValidator, registerValidator } from '@/validators/auth.validators';
import * as AuthController from '@/controllers/auth.controller';

const router = Router();

router.post('/register', registerValidator, validateRequest, AuthController.register);
router.post('/login', loginValidator, validateRequest, AuthController.login);

export default router;

