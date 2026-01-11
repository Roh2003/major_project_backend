import { acceptConsultationRequest, counselorLogin, createConsultationRequest, createCounselor, getActiveCounselors, getAllCounselor, getConsultationRequests, rejectConsultationRequest } from "../../controllers/counselor.controller";
import { authenticate, authUser } from "../../middlewares/auth";
import { Router } from "express";

const router = Router() 

// router.use(authenticate)

router.post('/', createCounselor)
router.get('/', getAllCounselor)
router.post('/login', counselorLogin)

// router.put("/availability", setAvailability);

//mobile apis 
router.get('/active', getActiveCounselors)
router.post('/request', authUser, createConsultationRequest)

//counselor app apis

router.get('/councelor/request',authUser, getConsultationRequests)
router.get('/counselor/requests/:id/accept', authUser, acceptConsultationRequest )
router.get('/counselor/requests/:id/reject', authUser, rejectConsultationRequest  )

//meeting apis
export default router;