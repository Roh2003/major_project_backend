import { Router } from 'express';
import authRoutes from '@/routes/subRoutes/auth.routes';

const router = Router();

router.use('/user/auth', authRoutes);

export default router;

