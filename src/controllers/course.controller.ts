import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '@/config/database';
import prisma from '@/prisma';
import { sendResponse } from '@/utils/responseUtils';
import STATUS_CODES from '@/utils/statusCodes';
import { hash } from 'crypto';
import { hashPassword } from '@/utils/password';
import { comparePassword } from '@/utils/authUtils';
import { generateToken } from '@/utils/generateToken';


export const getAllCoursesAdmin = async (req: Request, res: Response): Promise<void> => {
    console.log("[getAllCoursesAdmin] API called");
    // console.log("[getAllCoursesAdmin] called by user:", req.user ? req.user.id : "unknown");
    try {
      const courses = await prisma.courses.findMany({
        include: {
          lessons: true
        },
        orderBy: { createdAt: "desc" }
      })
      console.log(`[getAllCoursesAdmin] Successfully fetched ${courses.length} courses`);
      sendResponse(res, true, courses, "Courses fetched successfully", 200)
    } catch (error) {
      console.error("[getAllCoursesAdmin] Error fetching courses:", error);
      sendResponse(res, false, null, "Failed to fetch courses", 500)
    }
  }
  

export const createCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        description,
        price,
        category,
        level,
        thumbnailUrl,
        instructor,
        duration
      } = req.body
  
      if (!title || !description) {
        sendResponse(res, false, null, "Title and description are required", 400)
        return
      }
  
      const course = await prisma.courses.create({
        data: {
          title,
          description,
          price,
          category,
          level,
          thumbnailUrl,
          isPublished: false,
          instructor,
          duration
        }
      })
  
      sendResponse(res, true, course, "Course created successfully", 201)
    } catch (error) {
      console.error("Create course error:", error)
      sendResponse(res, false, null, "Failed to create course", 500)
    }
}

export const updateCourse = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  const updateFields = req.body;

  try {
    const allowedFields = [
      "title",
      "description",
      "price",
      "thumbnailUrl",
      "level",
      "category",
      "language",
      "isPublished",
      "instructor",
      "duration"
    ];
    const dataToUpdate: Record<string, any> = {};

    allowedFields.forEach((field) => {
      if (updateFields.hasOwnProperty(field)) {
        dataToUpdate[field] = updateFields[field];
      }
    });

    if (Object.keys(dataToUpdate).length === 0) {
      sendResponse(res, false, null, "No valid fields provided for update", 400);
      return;
    }

    const updatedCourse = await prisma.courses.update({
      where: { id: Number(courseId) },
      data: dataToUpdate,
    });

    sendResponse(res, true, updatedCourse, "Course updated successfully", 200);
  } catch (error) {
    console.error("Update course error:", error);
    sendResponse(res, false, null, "Failed to update course", 500);
  }
};

  
export const togglePublishCourse = async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params
    const { isPublished } = req.body
  
    try {
      const course = await prisma.courses.update({
        where: { id: Number(courseId) },
        data: { isPublished }
      })
  
      sendResponse(
        res,
        true,
        course,
        `Course ${isPublished ? "published" : "unpublished"} successfully`,
        STATUS_CODES.OK
      )
    } catch (error) {
      sendResponse(res, false, null, "Failed to update course status", 500)
    }
}

export const deleteLesson = async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params
  
    try {
      await prisma.lessons.delete({
        where: { id: Number(lessonId) }
      })
  
      sendResponse(res, true, null, "Lesson deleted successfully", 200)
    } catch (error) {
      sendResponse(res, false, null, "Failed to delete lesson", 500)
    }
}

export const getPublishedCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("[getPublishedCourses] API called");
      const courses = await prisma.courses.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          thumbnailUrl: true,
          level: true,
          category: true
        }
      })
  
      sendResponse(res, true, courses, "Courses fetched", 200)
    } catch (error) {
      sendResponse(res, false, null, "Failed to fetch courses", 500)
    }
}

export const getCourseDetail = async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params;
    const userId = req.user?.id;
  
    try {
      const course = await prisma.courses.findFirst({
        where: {
          id: Number(courseId),
          isPublished: true
        },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              duration: true,
              isFreePreview: true,
              videoId: true,
              videoType: true,
              description: true
            }
          }
        }
      });
  
      if (!course) {
        sendResponse(res, false, null, "Course not found", 404);
        return;
      }

      // Check if user is enrolled
      let isEnrolled = false;
      if (userId) {
        const enrollment = await prisma.courseUserMapper.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: Number(courseId)
            }
          }
        });
        isEnrolled = !!enrollment;
      }

      const courseWithEnrollment = {
        ...course,
        isEnrolled
      };
  
      sendResponse(res, true, courseWithEnrollment, "Course detail fetched", 200);
    } catch (error) {
      console.error("[getCourseDetail] Error:", error);
      sendResponse(res, false, null, "Failed to fetch course detail", 500);
    }
}

export const getLessonVideo = async (req: Request, res: Response): Promise<void> => {
    const { lessonId } = req.params
  
    try {
      const lesson = await prisma.lessons.findUnique({
        where: { id: Number(lessonId) }
      })
  
      if (!lesson) {
        sendResponse(res, false, null, "Lesson not found", 404)
        return
      }
  
      sendResponse(res, true, lesson, "Lesson fetched", 200)
    } catch (error) {
      sendResponse(res, false, null, "Failed to fetch lesson", 500)
    }
}

export const addLesson = async (req: Request, res: Response): Promise<void> => {
    const { courseId } = req.params
  
    const {
      title,
      description,
      duration,
      videoId,
      isFreePreview,
    } = req.body
  
    if (!title || !videoId) {
      sendResponse(
        res,
        false,
        null,
        "Lesson title and YouTube video ID are required",
        400
      )
      return
    }
  
    try {
      // get last order
      const lastLesson = await prisma.lessons.findFirst({
        where: { courseId : Number(courseId) },
        orderBy: { order: "desc" },
      })
  
      const nextOrder = lastLesson ? lastLesson.order + 1 : 1
  
      const lesson = await prisma.lessons.create({
        data: {
          courseId : Number(courseId),
          title,
          description,
          duration,
          videoType: "YOUTUBE",
          videoId,
          isFreePreview: !!isFreePreview,
          order: nextOrder,
        },
      })
  
      sendResponse(
        res,
        true,
        lesson,
        "Lesson added successfully",
        201
      )
    } catch (error) {
      console.error("Add lesson error:", error)
      sendResponse(
        res,
        false,
        null,
        "Failed to add lesson",
        500
      )
    }
}
  
export const getAllLessonById = async (req: Request, res: Response): Promise<void> => {
  const { courseId } = req.params;
  if (!courseId) {
    sendResponse(res, false, null, "Course ID is required", 400);
    return;
  }
  try {
    const lessons = await prisma.lessons.findMany({
      where: { courseId: Number(courseId) },
      orderBy: { order: "asc" },
    });
    sendResponse(res, true, lessons, "Lessons fetched successfully", 200);
  } catch (error) {
    console.error("Get all lessons by courseId error:", error);
    sendResponse(res, false, null, "Failed to fetch lessons", 500);
  }
};

export const updateLesson = async (req: Request, res: Response): Promise<void> => {
  const { lessonId } = req.params;
  const { title, description, videoId, duration, isFreePreview, order } = req.body;

  try {
    // Check if lesson exists
    const existingLesson = await prisma.lessons.findUnique({
      where: { id: Number(lessonId) }
    });

    if (!existingLesson) {
      sendResponse(res, false, null, "Lesson not found", 404);
      return;
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (videoId !== undefined) updateData.videoId = videoId;
    if (duration !== undefined) updateData.duration = duration;
    if (isFreePreview !== undefined) updateData.isFreePreview = !!isFreePreview;
    if (order !== undefined) updateData.order = order;

    // Update lesson
    const updatedLesson = await prisma.lessons.update({
      where: { id: Number(lessonId) },
      data: updateData
    });

    sendResponse(res, true, updatedLesson, "Lesson updated successfully", 200);
  } catch (error) {
    console.error("Update lesson error:", error);
    sendResponse(res, false, null, "Failed to update lesson", 500);
  }
};

  
  
  