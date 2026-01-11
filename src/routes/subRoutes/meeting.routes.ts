// routes/meeting.routes.ts
import express from "express"
import { authenticate } from "../../middlewares/auth"
import { generateAgoraToken, endMeeting } from "../../controllers/meeting.controller"

const router = express.Router()

router.post("/token", authenticate, generateAgoraToken)
router.post("/end", authenticate, endMeeting)

export default router
