/**
 * FINAL NPTEL Ingestion Script (TypeScript)
 * ----------------------------------------
 * - Fetches courses from NPTELPrep API
 * - Fetches lessons from `materials`
 * - Uses DB transactions (atomic per course)
 * - Rolls back course if ANY lesson fails
 * - Stores metadata only (no videos)
 */

import fetch from "node-fetch";
import { PrismaClient, CourseLevel } from "@prisma/client";

const prisma = new PrismaClient();

const BASE_URL = "https://api.nptelprep.in";
const API_KEY = process.env.NPTEL_API_KEY;

// --------------------
// Types
// --------------------

interface NptelCourse {
  course_code: string;
  course_name: string;
  video_count: number;
  weeks: (number | null)[];
}

interface NptelLesson {
  id: number;
  title: string;
  description?: string;
  type: string;
  weekNumber?: number;
  url: string;
}

interface CourseListResponse {
  courses?: NptelCourse[];
}

interface CourseDetailResponse {
  course_code: string;
  course_name: string;
  materials?: NptelLesson[];
  assignments?: unknown[];
}

// --------------------
// API Helpers
// --------------------

async function fetchAllCourses(): Promise<NptelCourse[]> {
  console.log("📡 Fetching all NPTEL courses...");

  const res = await fetch(`${BASE_URL}/courses`, {
    headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch courses (${res.status})`);
  }

  const json = (await res.json()) as CourseListResponse;

  if (!json.courses || !Array.isArray(json.courses)) {
    console.error("❌ Raw courses API response:", json);
    throw new Error("Invalid courses API response format");
  }

  return json.courses;
}

async function fetchCourseMaterials(
  courseCode: string
): Promise<NptelLesson[]> {
  const res = await fetch(`${BASE_URL}/courses/${courseCode}`, {
    headers: API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch course ${courseCode}`);
  }

  const json = (await res.json()) as CourseDetailResponse;

  if (!json.materials || !Array.isArray(json.materials)) {
    console.error("❌ Raw lesson API response:", json);
    throw new Error(`Invalid lesson response for course ${courseCode}`);
  }

  return json.materials;
}

// --------------------
// Main Ingestion Logic
// --------------------

async function ingestNptel(): Promise<void> {
  console.log("🚀 Starting NPTEL ingestion...\n");

  const courses = await fetchAllCourses();
  console.log(`📚 Total courses received: ${courses.length}\n`);

  let committedCourses = 0;
  let committedLessons = 0;

  for (const course of courses) {
    console.log(`➡️ Processing course: ${course.course_name}`);

    // Prevent duplicates
    const exists = await prisma.courses.findFirst({
      where: {
        title: course.course_name,
        instructor: "NPTEL"
      }
    });

    if (exists) {
      console.log("⚠️ Course already exists. Skipping.\n");
      continue;
    }

    try {
      // 🔐 TRANSACTION (course + all lessons)
      await prisma.$transaction(async (tx) => {
        const createdCourse = await tx.courses.create({
          data: {
            title: course.course_name,
            description: null,
            price: 0,
            thumbnailUrl: null, // Admin will add later
            instructor: "NPTEL",
            duration: null,
            level: CourseLevel.BEGINNER,
            category: null,
            language: "English",
            isPublished: false,
            tutorId: null
          }
        });

        console.log(
          `✅ Course staged [ID=${createdCourse.id}] → ${createdCourse.title}`
        );

        const materials = await fetchCourseMaterials(course.course_code);

        let order = 1;
        let lessonCount = 0;

        for (const lesson of materials) {
          if (lesson.type !== "video" || !lesson.url) continue;

          await tx.lessons.create({
            data: {
              courseId: createdCourse.id,
              title: lesson.title,
              description: lesson.description ?? null,
              videoType: "external",
              videoId: lesson.url,
              duration: null,
              order: order++,
              isFreePreview: true
            }
          });

          lessonCount++;
          committedLessons++;

          console.log(`   📌 Lesson staged → ${lesson.title}`);
        }

        if (lessonCount === 0) {
          throw new Error("No valid video lessons found");
        }

        committedCourses++;
        console.log(`📦 ${lessonCount} lessons staged`);
      },
      {
        timeout: 30000
      }
    );

      console.log(`🎉 Course committed successfully\n`);
    } catch (err) {
      console.error(
        `❌ Transaction rolled back for course: ${course.course_name}`
      );
      console.error(err);
      console.log("");
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 NPTEL INGESTION COMPLETED");
  console.log(`✅ Courses committed : ${committedCourses}`);
  console.log(`🎬 Lessons committed : ${committedLessons}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

// --------------------
// Run Script
// --------------------

ingestNptel()
  .catch((err) => {
    console.error("❌ Fatal ingestion error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("🔌 Prisma disconnected");
  });
