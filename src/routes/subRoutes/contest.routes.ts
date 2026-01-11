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
import { authAdmin, authUser } from "../../middlewares/auth";

const router = Router()

// Admin routes - for contest management (requires admin authentication)
router.post("/", authAdmin, createContest)
router.get("/admin/all", authAdmin, getAllContestsAdmin)
router.get("/admin/:contestId", authAdmin, getContestByIdAdmin)
router.put("/:contestId", authAdmin, updateContest)
router.put("/:contestId/publish", authAdmin, publishContest)

// Question management (admin only)
router.post("/:contestId/questions", authAdmin, addContestQuestion)
// router.put("/questions/:questionId", authAdmin, updateContestQuestion)
// router.delete("/questions/:questionId", authAdmin, deleteContestQuestion)

// Mobile routes - for learners (requires user authentication)
router.get("/", authUser, getAllContest)  // Get all published contests
router.get("/:contestId/details", authUser, getContestDetails)  // Get contest with questions
router.post("/:contestId/start", authUser, startContest)  // Start a contest attempt
router.post("/:contestId/submit", authUser, submitContest)  // Submit contest answers
router.get("/:contestId/leaderboard", authUser, getContestLeaderboard)  // Get leaderboard


export default router;