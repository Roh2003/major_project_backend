import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendResponse } from '../utils/responseUtils';

// Enroll user in a course
export const enrollCourse = async (req: Request, res: Response): Promise<void> => {
  console.log("[enrollCourse] API called");
  
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, false, null, "User not authenticated", 401);
      return;
    }

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { id: Number(courseId) }
    });

    if (!course) {
      sendResponse(res, false, null, "Course not found", 404);
      return;
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseUserMapper.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: Number(courseId)
        }
      }
    });

    if (existingEnrollment) {
      sendResponse(res, false, null, "Already enrolled in this course", 400);
      return;
    }

    // Create enrollment
    const enrollment = await prisma.courseUserMapper.create({
      data: {
        userId,
        courseId: Number(courseId)
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true
          }
        }
      }
    });

    console.log(`[enrollCourse] User ${userId} enrolled in course ${courseId}`);
    sendResponse(res, true, enrollment, "Successfully enrolled in course", 201);

  } catch (error) {
    console.error("[enrollCourse] Error:", error);
    sendResponse(res, false, null, "Failed to enroll in course", 500);
  }
};

// Get user's enrolled courses
export const getEnrolledCourses = async (req: Request, res: Response): Promise<void> => {
  console.log("[getEnrolledCourses] API called");
  
  try {
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, false, null, "User not authenticated", 401);
      return;
    }

    const enrollments = await prisma.courseUserMapper.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    });

    const enrichedCourses = enrollments.map(enrollment => ({
      ...enrollment.course,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      isCompleted: enrollment.isCompleted,
isEnrolled: true
    }));

    sendResponse(res, true, enrichedCourses, "Enrolled courses fetched", 200);

  } catch (error) {
    console.error("[getEnrolledCourses] Error:", error);
    sendResponse(res, false, null, "Failed to fetch enrolled courses", 500);
  }
};

// Check if user is enrolled in a specific course
export const checkEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, false, { isEnrolled: false }, "User not authenticated", 401);
      return;
    }

    const enrollment = await prisma.courseUserMapper.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: Number(courseId)
        }
      }
    });

    sendResponse(res, true, { isEnrolled: !!enrollment }, "Enrollment status checked", 200);

  } catch (error) {
    console.error("[checkEnrollment] Error:", error);
    sendResponse(res, false, null, "Failed to check enrollment", 500);
  }
};

// Update course progress
export const updateProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { progress, isCompleted } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, false, null, "User not authenticated", 401);
      return;
    }

    const enrollment = await prisma.courseUserMapper.update({
      where: {
        userId_courseId: {
          userId,
          courseId: Number(courseId)
        }
      },
      data: {
        progress: progress || 0,
        isCompleted: isCompleted || false,
        completedAt: isCompleted ? new Date() : null
      }
    });

    sendResponse(res, true, enrollment, "Progress updated successfully", 200);

  } catch (error) {
    console.error("[updateProgress] Error:", error);
    sendResponse(res, false, null, "Failed to update progress", 500);
  }
};

// Unenroll from a course
export const unenrollCourse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      sendResponse(res, false, null, "User not authenticated", 401);
      return;
    }

    await prisma.courseUserMapper.delete({
      where: {
        userId_courseId: {
          userId,
          courseId: Number(courseId)
        }
      }
    });

    sendResponse(res, true, null, "Successfully unenrolled from course", 200);

  } catch (error) {
    console.error("[unenrollCourse] Error:", error);
    sendResponse(res, false, null, "Failed to unenroll from course", 500);
  }
};
