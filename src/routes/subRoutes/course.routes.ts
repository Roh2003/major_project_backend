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
import { authAdmin, authAdminOrUser, authUser, authTutor } from '../../middlewares/auth';
import { authAdminOrTutor } from '../../middlewares/authAdminOrTutor';

const router = Router();

// ---- Admin/Tutor Routes ----
router.get('/', getAllCoursesAdmin); // Both can view
router.post('/', authAdminOrTutor, createCourse); // Both can create
router.patch('/:courseId', authAdminOrTutor, updateCourse); // Both can update
router.put('/:courseId/publish', authAdmin, togglePublishCourse); // Only admin can publish
router.get('/:courseId/lessons', authAdminOrTutor, getAllLessonById); 
router.post('/:courseId/lessons', authAdminOrTutor, addLesson);
router.put('/lessons/:lessonId', authAdminOrTutor, updateLesson);
router.delete('/lessons/:lessonId', authAdminOrTutor, deleteLesson);

// ---- User Routes ----
router.get('/courses', authUser, getPublishedCourses);
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