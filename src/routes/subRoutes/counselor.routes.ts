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

import { authAdmin, authAdminOrUser, authUser } from "../../middlewares/auth";
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
router.get('/requests', authUser, getConsultationRequests)      // Get pending requests
router.post('/requests/:id/accept', authUser, acceptConsultationRequest)  // Accept request
router.post('/requests/:id/reject', authUser, rejectConsultationRequest)  // Reject request

// ========================================
// COUNSELOR APP ROUTES - Profile & Settings
// ========================================
router.put('/availability', authUser, setAvailability)          // Toggle ONLINE/OFFLINE
router.get('/profile', authUser, getCounselorProfile)           // Get own profile
router.patch('/profile', authUser, updateCounselorProfile)      // Update profile
router.get('/revenue', authUser, getCounselorRevenue)           // Get earnings & stats

// ========================================
// MEETING ROUTES - For Both Users & Counselors
// ========================================
router.get('/meetings', authUser, getMyMeetings)                // Get my meetings (query: ?userType=counselor)
router.get('/meetings/:meetingId', authUser, getMeetingById)    // Get single meeting
router.post('/meetings/:meetingId/join', authUser, joinMeeting) // Join meeting (validates time, generates token
router.post('/meetings/:meetingId/token', authUser, generateAgoraToken) // Generate token (legacy)
router.post('/meetings/end', authUser, endMeeting)              // End meeting

export default router;