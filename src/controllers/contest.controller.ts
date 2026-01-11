import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../config/database';
import prisma from '../prisma';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';
import { hash } from 'crypto';
import { hashPassword } from '../utils/password';
import { comparePassword } from '../utils/authUtils';
import { generateToken } from '../utils/generateToken';
import { number } from 'joi';

export const createContest = async (req: Request, res: Response): Promise<void> => {
    console.log("[createContest] API called");
  
    try {
      const {
        title,
        description,
        category,
        startTime,
        endTime,
        durationMinutes,
        totalMarks
      } = req.body;
  
      const contest = await prisma.contest.create({
        data: {
          title,
          description,
          category,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          durationMinutes: Number(durationMinutes),
          totalMarks,
          isActive: true,
          isPublished: false
        }
      });
  
      console.log("[createContest] Contest created:", contest.id);
      sendResponse(res, true, contest, "Contest created successfully", 201);
  
    } catch (error) {
      console.error("[createContest] Error:", error);
      sendResponse(res, false, null, "Failed to create contest", 500);
    }
  };

export const updateContest = async (req: Request, res: Response): Promise<void> => {
  console.log("[updateContest] API called");
  try {
    const { contestId } = req.params;

    // Only allow fields that are present in the req.body to be updated
    const {
      title,
      description,
      category,
      startTime,
      endTime,
      durationMinutes,
      totalMarks,
      isActive,
      isPublished
    } = req.body;

    // Build the update data object only with fields that are defined
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (durationMinutes !== undefined) updateData.durationMinutes = Number(durationMinutes);
    if (totalMarks !== undefined) updateData.totalMarks = totalMarks;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedContest = await prisma.contest.update({
      where: { id: Number(contestId) },
      data: updateData
    });

    console.log("[updateContest] Contest updated:", updatedContest.id);
    sendResponse(res, true, updatedContest, "Contest updated successfully", 200);

  } catch (error) {
    console.error("[updateContest] Error:", error);
    sendResponse(res, false, null, "Failed to update contest", 500);
  }
};

  
export const getAllContestsAdmin = async (req: Request, res: Response): Promise<void> => {
    console.log("[getAllContestsAdmin] API called");
  
    try {
      const contests = await prisma.contest.findMany({
        include: {
          ContestQuestion: true
        },
        orderBy: { createdAt: "desc" }
      });
  
      console.log(`[getAllContestsAdmin] Fetched ${contests.length} contests`);
      sendResponse(res, true, contests, "Contests fetched successfully", 200);
  
    } catch (error) {
      console.error("[getAllContestsAdmin] Error:", error);
      sendResponse(res, false, null, "Failed to fetch contests", 500);
    }
  };

export const getContestByIdAdmin = async (req: Request, res: Response): Promise<void> => {
    console.log("[getContestByIdAdmin] API called");
  
    try {
      const { contestId } = req.params;
  
      const contest = await prisma.contest.findUnique({
        where: { id: Number(contestId) },
        include: {
          ContestQuestion: true
        }
      });
  
      if (!contest) {
        sendResponse(res, false, null, "Contest not found", 404);
        return;
      }
  
      sendResponse(res, true, contest, "Contest fetched successfully", 200);
  
    } catch (error) {
      console.error("[getContestByIdAdmin] Error:", error);
      sendResponse(res, false, null, "Failed to fetch contest", 500);
    }
};
  
export const publishContest = async (req: Request, res: Response): Promise<void> => {
    console.log("[publishContest] API called");
  
    try {
      const { contestId } = req.params;
  
      await prisma.contest.update({
        where: { id: Number(contestId) },
        data: { isPublished: true }
      });
  
      sendResponse(res, true, null, "Contest published successfully", 200);
  
    } catch (error) {
      console.error("[publishContest] Error:", error);
      sendResponse(res, false, null, "Failed to publish contest", 500);
    }
  };
  
  
export const addContestQuestion = async (req: Request, res: Response): Promise<void> => {
    console.log("[addContestQuestion] API called");
  
    try {
      const { contestId } = req.params;
      const {
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption,
        marks
      } = req.body;
  
      const newQuestion = await prisma.contestQuestion.create({
        data: {
          contestId: Number(contestId),
          questionText: question,
          optionA,
          optionB,
          optionC,
          optionD,
          correctOption,
          marks
        }
      });
  
      sendResponse(res, true, newQuestion, "Question added successfully", 201);
  
    } catch (error) {
      console.error("[addContestQuestion] Error:", error);
      sendResponse(res, false, null, "Failed to add question", 500);
    }
  };
  
// mobile

export const getAllContest = async (req: Request, res: Response): Promise<void> => {
    console.log("[getAllContest] API called");
  
    try {
      const userId = req.user?.id;

      const contests = await prisma.contest.findMany({
        where: {
          isPublished: true,
          endTime: { gt: new Date() }
        },
        orderBy: { startTime: "asc" }
      });

      // If user is authenticated, check their attempts
      let contestsWithAttempts = contests;
      
      if (userId) {
        const userAttempts = await prisma.contestAttempt.findMany({
          where: {
            userId,
            contestId: { in: contests.map(c => c.id) },
            submittedAt: { not: null }  // Only completed attempts
          },
          select: {
            contestId: true,
            score: true,
            submittedAt: true
          }
        });

        // Create a map of attempts by contestId
        const attemptMap = new Map(userAttempts.map(a => [a.contestId, a]));

        // Add attempt info to each contest
        contestsWithAttempts = contests.map(contest => ({
          ...contest,
          userAttempt: attemptMap.get(contest.id) || null,
          hasAttempted: attemptMap.has(contest.id)
        }));
      }
  
      sendResponse(res, true, contestsWithAttempts, "Live contests fetched", 200);
  
    } catch (error) {
      console.error("[getAllContest] Error:", error);
      sendResponse(res, false, null, "Failed to fetch contests", 500);
    }
};
  
export const getContestDetails = async (req: Request, res: Response): Promise<void> => {
    console.log("[getContestDetails] API called");
  
    try {
      const { contestId } = req.params;
  
      const contest = await prisma.contest.findUnique({
        where: { id: Number(contestId) },
        include: {
          ContestQuestion: {
            select: {
              id: true,
              questionText: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              marks: true
            }
          }
        }
      });
  
      if (!contest) {
        sendResponse(res, false, null, "Contest not found", 404);
        return;
      }
  
      sendResponse(res, true, contest, "Contest details fetched", 200);
  
    } catch (error) {
      console.error("[getContestDetails] Error:", error);
      sendResponse(res, false, null, "Failed to fetch contest details", 500);
    }
  };
  

  export const startContest = async (req: Request, res: Response): Promise<void> => {
    console.log("[startContest] API called");
  
    try {
      const { contestId } = req.params;
      const userId = req.user?.id;
  
      // Validate user is authenticated
      if (!userId) {
        sendResponse(res, false, null, "User not authenticated", 401);
        return;
      }
  
      const attempt = await prisma.contestAttempt.create({
        data: {
          contestId: Number(contestId),
          userId,
          startedAt: new Date()
        }
      });
  
      sendResponse(res, true, attempt, "Contest started", 201);
  
    } catch (error) {
      console.error("[startContest] Error:", error);
      sendResponse(res, false, null, "Failed to start contest", 500);
    }
  };

  export const submitContest = async (req: Request, res: Response): Promise<void> => {
    console.log("[submitContest] API called");
  
    try {
      const { contestId } = req.params;
      const { answers, timeTaken } = req.body;
      const userId = req.user?.id;
  
      // Validate user is authenticated
      if (!userId) {
        sendResponse(res, false, null, "User not authenticated", 401);
        return;
      }
  
      // Fetch all questions for this contest with correct answers
      const questions = await prisma.contestQuestion.findMany({
        where: { contestId: Number(contestId) },
        select: {
          id: true,
          correctOption: true,
          marks: true
        }
      });

      // Calculate score by comparing answers
      let totalScore = 0;
      const answerMap = new Map(answers.map((a: any) => [a.questionId, a.selectedOption]));

      for (const question of questions) {
        const userAnswer = answerMap.get(question.id);
        if (userAnswer && userAnswer === question.correctOption) {
          totalScore += question.marks;
        }
      }

      console.log(`[submitContest] User ${userId} scored ${totalScore} marks`);

      // Find existing attempt or create new one
      const existingAttempt = await prisma.contestAttempt.findFirst({
        where: { 
          contestId: Number(contestId), 
          userId,
          submittedAt: null  // Only get attempts that haven't been submitted yet
        }
      });

      if (existingAttempt) {
        // Update existing attempt
        await prisma.contestAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            submittedAt: new Date(),
            timeTaken,
            score: totalScore
          }
        });
        console.log(`[submitContest] Updated existing attempt ${existingAttempt.id}`);
      } else {
        // Create new attempt (in case startContest wasn't called)
        await prisma.contestAttempt.create({
          data: {
            contestId: Number(contestId),
            userId,
            startedAt: new Date(),
            submittedAt: new Date(),
            timeTaken,
            score: totalScore
          }
        });
        console.log(`[submitContest] Created new attempt for user ${userId}`);
      }
  
      sendResponse(res, true, { score: totalScore }, "Contest submitted successfully", 200);
  
    } catch (error) {
      console.error("[submitContest] Error:", error);
      sendResponse(res, false, null, "Failed to submit contest", 500);
    }
  };
  
export const getContestLeaderboard = async (req: Request, res: Response): Promise<void> => {
    console.log("[getContestLeaderboard] API called");
  
    try {
      const { contestId } = req.params;
  
      const leaderboard = await prisma.contestAttempt.findMany({
        where: { contestId: Number(contestId) },
        orderBy: [
          { score: "desc" },
          { timeTaken: "asc" }
        ],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
            }
          }
        }
      });
  
      sendResponse(res, true, leaderboard, "Leaderboard fetched", 200);
  
    } catch (error) {
      console.error("[getContestLeaderboard] Error:", error);
      sendResponse(res, false, null, "Failed to fetch leaderboard", 500);
    }
  };
  