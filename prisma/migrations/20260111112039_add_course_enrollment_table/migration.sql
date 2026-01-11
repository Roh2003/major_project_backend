-- CreateTable
CREATE TABLE "course_user_mapper" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_user_mapper_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_user_mapper_userId_idx" ON "course_user_mapper"("userId");

-- CreateIndex
CREATE INDEX "course_user_mapper_courseId_idx" ON "course_user_mapper"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_user_mapper_userId_courseId_key" ON "course_user_mapper"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "course_user_mapper" ADD CONSTRAINT "course_user_mapper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_user_mapper" ADD CONSTRAINT "course_user_mapper_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
