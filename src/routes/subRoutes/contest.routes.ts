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
router.post("/", createContest)                      // Create contest
router.get("/admin", getAllContestsAdmin)            // Get all contests (admin)
router.get("/admin/:contestId", getContestByIdAdmin) // Get contest by ID (admin)
router.put("/:contestId", updateContest)             // Update contest
router.put("/:contestId/publish", publishContest)    // Publish/Unpublish contest

// ========================================
// QUESTION MANAGEMENT (Admin only)
// ========================================
router.post("/:contestId/questions", addContestQuestion)  // Add question to contest

// ========================================
// USER/MOBILE ROUTES - For Learners
// ========================================
router.get("/published", authUser, getAllContest)              // Get all published contests
router.get("/:contestId/details", authUser, getContestDetails) // Get contest with questions
router.post("/:contestId/start", authUser, startContest)       // Start a contest attempt
router.post("/:contestId/submit", authUser, submitContest)     // Submit contest answers
router.get("/:contestId/leaderboard", authUser, getContestLeaderboard) // Get leaderboard


export default router;