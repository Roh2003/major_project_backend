import { Router } from 'express';
import authRoutes from './subRoutes/auth.routes';
import courseRoutes from './subRoutes/course.routes'
import contestRoutes from './subRoutes/contest.routes'
import counselorRouter from './subRoutes/counselor.routes'
import MeetingRoutes from './subRoutes/meeting.routes'
import ResourceRoutes from './subRoutes/resource.route'
import TutorRoutes from './subRoutes/tutor.routes'
const router = Router();

router.use('/user/auth', authRoutes);
router.use('/admin/courses', courseRoutes)
router.use('/admin/contest', contestRoutes)
router.use('/admin/counselor', counselorRouter)
router.use('/meeting/' , MeetingRoutes )
router.use('/resource/' , ResourceRoutes)
router.use('/tutor/', TutorRoutes)

export default router;

