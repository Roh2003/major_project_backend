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
import { RtcTokenBuilder, RtcRole } from "agora-access-token"

export const generateAgoraToken = async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.body;
      const userId = req.user?.id;
  
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

  export const endMeeting = async (req: Request, res: Response) => {
    try {
      const { meetingId } = req.body;
      const userId = req.user?.id;

      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting) {
        return sendResponse(res, false, null, "Meeting not found", STATUS_CODES.NOT_FOUND);
      }

      // Only participants can end meeting
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

      // 1️⃣ Update meeting
      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          endTime,
          duration: durationSeconds,
          status: "COMPLETED",
        },
      });

      // 2️⃣ Update counselor stats
      const revenuePerMeeting = 200; 

      await prisma.counselor.update({
        where: { id: meeting.counselorId },
        data: {
          totalMeetings: { increment: 1 },
          totalRevenue: { increment: revenuePerMeeting },
        },
      });

      // 3️⃣ Update consultation request
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
  