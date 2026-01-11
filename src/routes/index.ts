import { Router } from 'express';
import authRoutes from '@/routes/subRoutes/auth.routes';
import courseRoutes from '@/routes/subRoutes/course.routes'
import contestRoutes from '@/routes/subRoutes/contest.routes'
import counselorRouter from '@/routes/subRoutes/counselor.routes'
import MeetingRoutes from '@/routes/subRoutes/meeting.routes'
import ResourceRoutes from '@/routes/subRoutes/resource.route'
const router = Router();

router.use('/user/auth', authRoutes);
router.use('/admin/courses', courseRoutes)
router.use('/admin/contest', contestRoutes)
router.use('/admin/counselor', counselorRouter)
router.use('/meeting/' , MeetingRoutes )
router.use('/resource/' , ResourceRoutes)

export default router;

