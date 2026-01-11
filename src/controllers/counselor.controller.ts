import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '@/config/database';
import prisma from '@/prisma';
import { sendResponse } from '@/utils/responseUtils';
import STATUS_CODES from '@/utils/statusCodes';
import { hash } from 'crypto';
import { hashPassword } from '@/utils/password';
import { comparePassword } from '@/utils/authUtils';
import { generateToken } from '@/utils/generateToken';
import { number } from 'joi';
import { RtcTokenBuilder, RtcRole } from "agora-access-token"

export const getAllCounselor = async (req: Request, res: Response): Promise<void> => {
  try {
    const counselors = await prisma.counselor.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        specialization: true,
        employmentType: true,
        experience: true,
        profileImage: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    sendResponse(res, true, counselors, "Counselors fetched successfully", STATUS_CODES.OK);
  } catch (error) {
    console.error("[getAllCounselor] Error:", error);
    sendResponse(res, false, null, "Failed to fetch counselors", STATUS_CODES.SERVER_ERROR);
  }
};

export const getActiveCounselors = async (req: Request, res: Response): Promise<void> => {
  try {
    const counselors = await prisma.counselor.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        specialization: true,
        employmentType: true,
        experience: true,
        profileImage: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    sendResponse(res, true, counselors, "Active counselors fetched successfully", STATUS_CODES.OK);
  } catch (error) {
    console.error("[getActiveCounselors] Error:", error);
    sendResponse(res, false, null, "Failed to fetch active counselors", STATUS_CODES.SERVER_ERROR);
  }
};


export const createCounselor = async (req: Request, res: Response): Promise<void> => {
  console.log("[createCounselor] API called");

  try {
    const {
      name,
      email,
      password,
      specialization,
      experience,
      employmentType,
      bio,
      profileImage
    } = req.body;

    // Check if counselor already exists
    const existing = await prisma.counselor.findUnique({ where: { email } });
    if (existing) {
      sendResponse(res, false, null, "Counselor already exists", STATUS_CODES.BAD_REQUEST);
      return;
    }

    const hashedPassword = await hashPassword(password);

    // // Guard: Check req.user presence & id type
    // const adminId = (req as any).user?.id;
    // if (!adminId) {
    //   sendResponse(res, false, null, "Unauthorized: admin user required", 401);
    //   return;
    // }

    const counselor = await prisma.counselor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        specialization,
        experience,
        employmentType,
        bio,
        createdByAdminId: "1",
        profileImage
      }
    });

    console.log("[createCounselor] Counselor created:", counselor.id);
    sendResponse(
      res,
      true,
      { counselorId: counselor.id },
      "Counselor created successfully",
      201
    );
  } catch (error) {
    console.error("[createCounselor] Error:", error);
    sendResponse(res, false, null, "Server error", STATUS_CODES.SERVER_ERROR);
  }
};

export const counselorLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find counselor by email
    const counselor = await prisma.counselor.findUnique({ where: { email } });

    if (!counselor) {
      sendResponse(res, false, null, "Invalid credentials", 401);
      return;
    }

    const isValid = await comparePassword(password, counselor.password);

    if (!isValid) {
      sendResponse(res, false, null, "Invalid credentials", 401);
      return;
    }

    const token = generateToken({
      userId: Number(counselor.id),
      email: counselor.email,
      username: counselor.name 
    });

    sendResponse(res, true, {
      token,
      counselor: {
        id: counselor.id,
        name: counselor.name,
        specialization: counselor.specialization,
        isActive: counselor.isActive
      }
    }, "Login successful", STATUS_CODES.OK);

  } catch (error) {
    console.error("[counselorLogin] Error:", error);
    sendResponse(res, false, null, "Server error", STATUS_CODES.SERVER_ERROR);
  }
};

export const createConsultationRequest = async (req:Request, res:Response) => {
  try {
    const userId = req.user!.id;
    const { counselorId, requestType, scheduledAt, message } = req.body;

    // 1️⃣ Validate counselor
    const counselor = await prisma.counselor.findUnique({
      where: { id: counselorId },
    });

    if (!counselor) {
      return sendResponse(res, false, null, "Counselor not found", STATUS_CODES.NOT_FOUND);
    }

    // 2️⃣ Instant request → counselor must be active
    if (requestType === "INSTANT" && !counselor.isActive) {
      return sendResponse(
        res,
        false,
        null,
        "Counselor is not active right now",
        STATUS_CODES.BAD_REQUEST
      );
    }

    // 3️⃣ Scheduled request → time required
    if (requestType === "SCHEDULED" && !scheduledAt) {
      return sendResponse(
        res,
        false,
        null,
        "Scheduled time is required",
        STATUS_CODES.BAD_REQUEST
      );
    }

    // 4️⃣ Prevent duplicate pending requests
    const existing = await prisma.consultationRequest.findFirst({
      where: {
        userId: Number(userId),
        counselorId,
        status: "PENDING",
      },
    });

    if (existing) {
      return sendResponse(
        res,
        false,
        null,
        "You already have a pending request with this counselor",
        STATUS_CODES.BAD_REQUEST
      );
    }

    // 5️⃣ Create request
    const request = await prisma.consultationRequest.create({
      data: {
        userId : Number(userId),
        counselorId,
        requestType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        message,
      },
    });

    return sendResponse(
      res,
      true,
      {
        requestId: request.id,
        status: request.status,
      },
      "Consultation request created",
      201
    );
  } catch (error) {
    console.error("[createConsultationRequest] Error:", error);
    return sendResponse(res, false, null, "Server error", STATUS_CODES.SERVER_ERROR);
  }
};

export const getConsultationRequests = async (req:Request, res:Response) => {
  try {
    const counselorId = req.user!.id
    const type = req.query.type as "INSTANT" | "SCHEDULED" | undefined


    const requests = await prisma.consultationRequest.findMany({
      where: {
        counselorId: String(counselorId),
        status: "PENDING",
        ...(type && { requestType: type }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({ requests })
  } catch (error) {
    console.error(error)
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: "Failed to fetch requests" })
  }
}

export const acceptConsultationRequest = async (req: Request, res: Response) => {
  try {
    const counselorId = req.user!.id
    const requestId = req.params.id

    const request = await prisma.consultationRequest.findUnique({
      where: { id: Number(requestId) },
    })

    if (!request || request.counselorId !== String(counselorId)) {
      return sendResponse(res, false, null, "Request not found", STATUS_CODES.NOT_FOUND);
    }

    if (request.status !== "PENDING") {
      return sendResponse(res, false, null, "Request already handled", STATUS_CODES.BAD_REQUEST);
    }

    // 1️⃣ Update request
    await prisma.consultationRequest.update({
      where: { id: Number(requestId) },
      data: {
        status: "ACCEPTED",
        respondedAt: new Date(),
      },
    })

    // 2️⃣ Create meeting
    const meeting = await prisma.meeting.create({
      data: {
        consultationRequestId: request.id,
        counselorId: String(counselorId),
        userId: request.userId,
        meetingProvider: "AGORA",
        meetingRoomId: `skillup-${request.id}`, // unique room
        status: "ONGOING",
      },
    })

    return sendResponse(
      res,
      true,
      {
        meetingId: meeting.id,
        meetingRoomId: meeting.meetingRoomId,
      },
      "Request accepted",
      STATUS_CODES.OK
    )
  } catch (error) {
    console.error(error)
    return sendResponse(res, false, null, "Failed to accept request", STATUS_CODES.SERVER_ERROR)
  }
}

export const rejectConsultationRequest = async (req: Request, res: Response) => {
  try {
    const counselorId = req.user!.id
    const requestId = Number(req.params.id)

    const request = await prisma.consultationRequest.findUnique({
      where: { id: requestId },
    })

    if (!request || request.counselorId !== String(counselorId)) {
      return sendResponse(res, false, null, "Request not found", STATUS_CODES.NOT_FOUND)
    }

    if (request.status !== "PENDING") {
      return sendResponse(res, false, null, "Request already handled", STATUS_CODES.BAD_REQUEST)
    }

    await prisma.consultationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        respondedAt: new Date(),
      },
    })

    return sendResponse(res, true, null, "Request rejected", STATUS_CODES.OK)
  } catch (error) {
    console.error(error)
    return sendResponse(res, false, null, "Failed to reject request", STATUS_CODES.SERVER_ERROR)
  }
}

export const generateAgoraToken = async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.body;
    const userId = req.user!.id;

    // 1️⃣ Get meeting from DB
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return sendResponse(res, false, null, "Meeting not found", STATUS_CODES.NOT_FOUND);
    }

    // 2️⃣ Only allow participants to request the token
    if (meeting.userId !== Number(userId) && meeting.counselorId !== String(userId)) {
      return sendResponse(res, false, null, "Access denied", STATUS_CODES.FORBIDDEN);
    }

    const appId = process.env.AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
    const channelName = meeting.meetingRoomId;
    const uid = 0; // Agora will auto-assign UID
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpireTime
    );

    return sendResponse(
      res,
      true,
      {
        token,
        appId,
        channelName,
      },
      "Token generated",
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error("[generateAgoraToken] Error:", error);
    return sendResponse(res, false, null, "Failed to generate Agora token", STATUS_CODES.SERVER_ERROR);
  }
};



  



// export const setAvailability = async (req: Request, res: Response) => {
//     const { isActive } = req.body;
  
//     const counselor = await prisma.counselor.update({
//       where: { id: req.user?.id },
//       data: { isActive }
//     });
  
//     res.json({
//       message: `Counselor is now ${isActive ? "Online" : "Offline"}`,
//       isActive: counselor.isActive
//     });
// };
  

// meetings controller

