import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

/**
 * Get all meetings for a user (learner or counselor)
 */
export const getMyMeetings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status, userType } = req.query;

    // Determine if user is counselor or regular user
    const isCounselor = userType === 'counselor';
    
    const where: any = isCounselor 
      ? { counselorId: String(userId) }
      : { userId: Number(userId) };

    if (status) {
      where.status = status;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        consultationRequest: {
          select: {
            requestType: true,
            message: true,
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        counselor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            profileImage: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return sendResponse(
      res,
      true,
      meetings,
      'Meetings fetched successfully',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[getMyMeetings] Error:', error);
    return sendResponse(res, false, null, 'Failed to fetch meetings', STATUS_CODES.SERVER_ERROR);
  }
};

/**
 * Get single meeting by ID
 */
export const getMeetingById = async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user!.id;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        consultationRequest: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        counselor: {
          select: {
            id: true,
            name: true,
            email: true,
            specialization: true,
            profileImage: true,
          }
        }
      }
    });

    if (!meeting) {
      return sendResponse(res, false, null, 'Meeting not found', STATUS_CODES.NOT_FOUND);
    }

    // Verify user access
    if (meeting.userId !== Number(userId) && meeting.counselorId !== String(userId)) {
      return sendResponse(res, false, null, 'Unauthorized', STATUS_CODES.FORBIDDEN);
    }

    return sendResponse(
      res,
      true,
      meeting,
      'Meeting fetched successfully',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[getMeetingById] Error:', error);
    return sendResponse(res, false, null, 'Failed to fetch meeting', STATUS_CODES.SERVER_ERROR);
  }
};

/**
 * Join meeting - validates time and returns join permission
 */
export const joinMeeting = async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user!.id;
    const { userType } = req.body; // 'user' or 'counselor'

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return sendResponse(res, false, null, 'Meeting not found', STATUS_CODES.NOT_FOUND);
    }

    // Verify user access
    const isCounselor = userType === 'counselor';
    const isAuthorized = isCounselor 
      ? meeting.counselorId === String(userId)
      : meeting.userId === Number(userId);

    if (!isAuthorized) {
      return sendResponse(res, false, null, 'Unauthorized', STATUS_CODES.FORBIDDEN);
    }

    // Check if meeting is already completed or cancelled
    if (meeting.status === 'COMPLETED' || meeting.status === 'CANCELLED') {
      return sendResponse(
        res,
        false,
        { canJoin: false },
        `Meeting is ${meeting.status.toLowerCase()}`,
        STATUS_CODES.BAD_REQUEST
      );
    }

    // For scheduled meetings, check if current time >= scheduled time
    const now = new Date();
    const meetingTime: any = meeting.scheduledTime;
    if (meetingTime && now < meetingTime) {
      const waitMinutes = Math.ceil((meetingTime.getTime() - now.getTime()) / 60000);
      return sendResponse(
        res,
        false,
        {
          canJoin: false,
          waitTime: waitMinutes,
          scheduledTime: meeting.scheduledTime,
        },
        `Meeting starts in ${waitMinutes} minute(s)`,
        STATUS_CODES.BAD_REQUEST
      );
    }

    // Update join status
    const updateData: any = {};
    if (isCounselor) {
      updateData.counselorJoined = true;
      updateData.counselorJoinedAt = new Date();
    } else {
      updateData.userJoined = true;
      updateData.userJoinedAt = new Date();
    }

    const updatedMeeting = await prisma.meeting.update({
      where: { id: meetingId },
      data: updateData,
    });

    // Check if both have joined - if yes, start the meeting
    const bothJoined = updatedMeeting.counselorJoined && updatedMeeting.userJoined;
    if (bothJoined && updatedMeeting.status !== 'ONGOING') {
      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          status: 'ONGOING',
          startTime: new Date(),
        },
      });
    }

    // Generate Agora token
    const appId = process.env.AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
    const channelName = meeting.meetingRoomId;
    const uid = 0; // Agora will auto-assign
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
        canJoin: true,
        token,
        appId,
        channelName,
        meetingStatus: bothJoined ? 'ONGOING' : 'WAITING',
        waitingFor: bothJoined ? null : (isCounselor ? 'user' : 'counselor'),
      },
      'Join permission granted',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[joinMeeting] Error:', error);
    return sendResponse(res, false, null, 'Failed to join meeting', STATUS_CODES.SERVER_ERROR);
  }
};

/**
 * Set counselor availability (ONLINE/OFFLINE)
 */
export const setAvailability = async (req: Request, res: Response) => {
  try {
    const counselorId = req.user!.id;
    const { isActive } = req.body;

    const counselor = await prisma.counselor.update({
      where: { id: String(counselorId) },
      data: { isActive },
    });

    return sendResponse(
      res,
      true,
      {
        isActive: counselor.isActive,
      },
      `Counselor is now ${isActive ? 'ONLINE' : 'OFFLINE'}`,
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[setAvailability] Error:', error);
    return sendResponse(res, false, null, 'Failed to update availability', STATUS_CODES.SERVER_ERROR);
  }
};

/**
 * Get counselor revenue and stats
 */
export const getCounselorRevenue = async (req: Request, res: Response) => {
  try {
    const counselorId = req.user!.id;

    const counselor = await prisma.counselor.findUnique({
      where: { id: String(counselorId) },
      select: {
        totalMeetings: true,
        totalRevenue: true,
      }
    });

    if (!counselor) {
      return sendResponse(res, false, null, 'Counselor not found', STATUS_CODES.NOT_FOUND);
    }

    // Get meeting history
    const meetings = await prisma.meeting.findMany({
      where: {
        counselorId: String(counselorId),
        status: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: {
        endTime: 'desc',
      },
      take: 50, // Last 50 meetings
    });

    const revenuePerMeeting = 200; // ₹200 per meeting

    return sendResponse(
      res,
      true,
      {
        totalMeetings: counselor.totalMeetings,
        totalRevenue: counselor.totalRevenue,
        revenuePerMeeting,
        meetings: meetings.map(m => ({
          id: m.id,
          userName: `${m.user.firstName} ${m.user.lastName}`,
          date: m.endTime,
          duration: m.duration,
          revenue: revenuePerMeeting,
        })),
      },
      'Revenue stats fetched successfully',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[getCounselorRevenue] Error:', error);
    return sendResponse(res, false, null, 'Failed to fetch revenue', STATUS_CODES.SERVER_ERROR);
  }
};

/**
 * Update counselor profile
 */
export const updateCounselorProfile = async (req: Request, res: Response) => {
  try {
    const counselorId = req.user!.id;
    const { name, bio, profileImage, specialization } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (profileImage) updateData.profileImage = profileImage;
    if (specialization) updateData.specialization = specialization;

    const counselor = await prisma.counselor.update({
      where: { id: String(counselorId) },
      data: updateData,
    });

    return sendResponse(
      res,
      true,
      {
        id: counselor.id,
        name: counselor.name,
        bio: counselor.bio,
        profileImage: counselor.profileImage,
        specialization: counselor.specialization,
      },
      'Profile updated successfully',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[updateCounselorProfile] Error:', error);
    return sendResponse(res, false, null, 'Failed to update profile', STATUS_CODES.SERVER_ERROR);
  }
};

/**
 * Get counselor profile
 */
export const getCounselorProfile = async (req: Request, res: Response) => {
  try {
    const counselorId = req.user!.id;

    const counselor = await prisma.counselor.findUnique({
      where: { id: String(counselorId) },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        profileImage: true,
        specialization: true,
        experience: true,
        employmentType: true,
        isActive: true,
        rating: true,
        totalMeetings: true,
        totalRevenue: true,
      }
    });

    if (!counselor) {
      return sendResponse(res, false, null, 'Counselor not found', STATUS_CODES.NOT_FOUND);
    }

    return sendResponse(
      res,
      true,
      counselor,
      'Profile fetched successfully',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[getCounselorProfile] Error:', error);
    return sendResponse(res, false, null, 'Failed to fetch profile', STATUS_CODES.SERVER_ERROR);
  }
};

// Keep existing functions from original file
export const generateAgoraToken = async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.body;
      const userId = req.user?.id;
  
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
      });
  
      if (!meeting) {
        return sendResponse(res, false, null, "Meeting not found", STATUS_CODES.NOT_FOUND);
      }
  
      if (meeting.userId !== Number(userId) && meeting.counselorId !== String(userId)) {
        return sendResponse(res, false, null, "Access denied", STATUS_CODES.FORBIDDEN);
      }
  
      const appId = process.env.AGORA_APP_ID!;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
      const channelName = meeting.meetingRoomId;
      const uid = 0;
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

  export const  endMeeting = async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.body;
      const userId = req.user?.id;

      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting) {
        return sendResponse(res, false, null, "Meeting not found", STATUS_CODES.NOT_FOUND);
      }

      if (
        String(meeting.userId) !== String(userId) &&
        String(meeting.counselorId) !== String(userId)
      ) {
        return sendResponse(res, false, null, "Unauthorized", STATUS_CODES.FORBIDDEN);
      }

      if (meeting.status !== "ONGOING") {
        return sendResponse(res, false, null, "Meeting already ended", STATUS_CODES.BAD_REQUEST);
      }

      const endTime = new Date();
      const startTime = meeting.startTime || meeting.createdAt;
      const durationSeconds = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          endTime,
          duration: durationSeconds,
          status: "COMPLETED",
        },
      });

      const revenuePerMeeting = 200; 

      await prisma.counselor.update({
        where: { id: meeting.counselorId },
        data: {
          totalMeetings: { increment: 1 },
          totalRevenue: { increment: revenuePerMeeting },
        },
      });

      await prisma.consultationRequest.update({
        where: { id: meeting.consultationRequestId },
        data: {
          status: "COMPLETED",
        },
      });

      return sendResponse(
        res,
        true,
        {
          durationSeconds,
          revenueEarned: revenuePerMeeting,
        },
        "Meeting ended successfully",
        STATUS_CODES.OK
      );
    } catch (error) {
      console.error(error);
      return sendResponse(res, false, null, "Failed to end meeting", STATUS_CODES.SERVER_ERROR);
    }
  };