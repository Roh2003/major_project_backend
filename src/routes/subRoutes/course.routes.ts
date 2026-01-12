import { Router } from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { courseCreateValidator } from '../../validators/course.validator';
import { 
    getAllCoursesAdmin, 
    createCourse, 
    togglePublishCourse,
    deleteLesson,
    getPublishedCourses,
    getCourseDetail,
    getLessonVideo,
    getAllLessonById,
    updateCourse,
    addLesson,
    updateLesson
  } from '../../controllers/course.controller';
import { 
  enrollCourse, 
  getEnrolledCourses, 
  checkEnrollment, 
  updateProgress, 
  unenrollCourse 
} from '../../controllers/enrollment.controller';
import { authAdminOrUser, authUser } from '../../middlewares/auth';

const router = Router();

// ---- Admin Routes ----
router.get('/', getAllCoursesAdmin);
router.post('/', courseCreateValidator, createCourse);
router.patch('/:courseId',updateCourse ); // Placeholder for updateCourse
router.put('/:courseId/publish', togglePublishCourse);
router.get('/:courseId/lessons', getAllLessonById); 
router.post('/:courseId/lessons', addLesson);
router.put('/lessons/:lessonId', updateLesson); // Placeholder for updateLesson
router.delete('/lessons/:lessonId', deleteLesson);

// ---- User Routes ----
router.get('/courses', getPublishedCourses);
router.get('/courses/:courseId', authUser, getCourseDetail);
router.get('/lessons/:lessonId', authUser, getLessonVideo);

// ---- Enrollment Routes ----
router.post('/:courseId/enroll', authUser, enrollCourse);
router.get('/enrolled', authUser, getEnrolledCourses);
router.get('/:courseId/enrollment-status', authUser, checkEnrollment);
router.put('/:courseId/progress', authUser, updateProgress);
router.delete('/:courseId/unenroll', authUser, unenrollCourse);


export default router;


// // Admin
// POST   /
// PUT    //:courseId/publish
// GET    /
// POST   //:courseId/lessons
// PUT    /admin/lessons/:lessonId
// DELETE /admin/lessons/:lessonId

// // User
// GET    /courses
// GET    /courses/:courseId
// GET    /lessons/:lessonId