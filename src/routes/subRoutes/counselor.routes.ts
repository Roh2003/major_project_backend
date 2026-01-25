import {
    acceptConsultationRequest,
    counselorLogin,
    createConsultationRequest,
    createCounselor,
    getActiveCounselors,
    getAllCounselor,
    getConsultationRequests,
    rejectConsultationRequest
} from "../../controllers/counselor.controller";

import {
    getMyMeetings,
    getMeetingById,
    joinMeeting,
    setAvailability,
    getCounselorRevenue,
    updateCounselorProfile,
    getCounselorProfile,
    generateAgoraToken,
    endMeeting
} from "../../controllers/meeting.controller";

import { authAdmin, authAdminOrUser, authUser, authCounselor, authUserOrCounselor } from "../../middlewares/auth";
import { Router } from "express";

const router = Router()

// ========================================
// ADMIN ROUTES
// ========================================
router.post('/', authAdmin, createCounselor)                    // Create counselor
router.get('/', authAdminOrUser, getAllCounselor)               // Get all counselors

// ========================================
// AUTHENTICATION
// ========================================
router.post('/login', counselorLogin)                           // Counselor login

// ========================================
// MOBILE/USER ROUTES - Consultations
// ========================================
router.get('/active', authUser, getActiveCounselors)            // Get online counselors
router.post('/request', authUser, createConsultationRequest)    // Create consultation request

// ========================================
// COUNSELOR APP ROUTES - Request Management
// ========================================
router.get('/requests', authCounselor, getConsultationRequests)      // Get pending requests
router.post('/requests/:id/accept', authCounselor, acceptConsultationRequest)  // Accept request
router.post('/requests/:id/reject', authCounselor, rejectConsultationRequest)  // Reject request

// ========================================
// COUNSELOR APP ROUTES - Profile & Settings
// ========================================
router.put('/availability', authCounselor, setAvailability)          // Toggle ONLINE/OFFLINE
router.get('/profile', authCounselor, getCounselorProfile)           // Get own profile
router.patch('/profile', authCounselor, updateCounselorProfile)      // Update profile
router.get('/revenue', authCounselor, getCounselorRevenue)           // Get earnings & stats

// ========================================
// MEETING ROUTES - For Both Users & Counselors
// ========================================
router.get('/meetings', authUserOrCounselor, getMyMeetings)                // Get my meetings (query: ?userType=counselor)
router.get('/meetings/:meetingId', authUserOrCounselor, getMeetingById)    // Get single meeting
router.post('/meetings/:meetingId/join', authUserOrCounselor, joinMeeting) // Join meeting (validates time, generates token)
router.post('/meetings/:meetingId/token', authUserOrCounselor, generateAgoraToken) // Generate token (legacy)
router.post('/meetings/end', authUserOrCounselor, endMeeting)              // End meeting

export default router;