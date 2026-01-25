import { Router } from "express";

import { 
  addContestQuestion, 
  createContest, 
  getAllContestsAdmin, 
  getContestByIdAdmin, 
  publishContest, 
  updateContest,
  getAllContest,
  getContestDetails,
  startContest,
  submitContest,
  getContestLeaderboard
} from "../../controllers/contest.controller";
import { authAdmin, authAdminOrUser, authUser } from "../../middlewares/auth";

const router = Router()

// ========================================
// ADMIN ROUTES - Contest Management
// ========================================
router.post("/", authAdmin, createContest)                      // Create contest
router.get("/", authAdmin, getAllContestsAdmin) // Get all contests (admin)
router.put("/:contestId/publish", authAdmin, publishContest)    // Publish/Unpublish contest

// ========================================
// QUESTION MANAGEMENT (Admin only)
// ========================================
router.post("/:contestId/questions", authAdmin, addContestQuestion)  // Add question to contest

// ========================================
// USER/MOBILE ROUTES - For Learners
// (These MUST come before /:contestId routes to avoid pattern matching issues)
// ========================================
router.get("/published", authUser, getAllContest)              // Get all published contests
router.get("/:contestId/details", authUser, getContestDetails) // Get contest with questions
router.post("/:contestId/start", authUser, startContest)       // Start a contest attempt
router.post("/:contestId/submit", authUser, submitContest)     // Submit contest answers
router.get("/:contestId/leaderboard", authUser, getContestLeaderboard) // Get leaderboard

// ========================================
// ADMIN ROUTES - Contest Details (MUST come after specific routes)
// ========================================
router.get("/:contestId", authAdmin, getContestByIdAdmin) // Get contest by ID (admin)
router.put("/:contestId", authAdmin, updateContest)             // Update contest


export default router;