import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '@/config/database';
import prisma from '@/prisma';
import { sendResponse } from '@/utils/responseUtils';
import STATUS_CODES from '@/utils/statusCodes';
import { hash } from 'crypto';
import { hashPassword } from '@/utils/password';

export const register = async (req: Request, res: Response): Promise<void> => {

  const {
    firstName,
    lastName,
    phoneNo,
    address,
    dateOfBirth,
    gender,
    state,
    country,
    currenrStudyLevel,
    email,
    username,
    password,
    isActive,
    isDeleted,
    deletedAt,
    createdAt,
    updatedAt
  } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized. Login to Continue" });
    return;
  }

  let userRole = await prisma.roles.findFirst({
    where: {
      name: "USER"
    }
  })

  if (!userRole) {
    sendResponse(
      res,
      false,
      null,
      'USER role not found in database',
      STATUS_CODES.SERVER_ERROR
    );
    return;
  }

  if (password) { 
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      sendResponse(
        res,
        false,
        null,
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      sendResponse(
        res,
        false,
        null,
        'Email must be a valid email address',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }
  }


  try {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          phoneNo,
          address,
          dateOfBirth,
          gender,
          state,
          country,
          currenrStudyLevel,
          email,
          username,
          password: await hashPassword(password),
        }
      });

      await tx.userRoleMapping.create({
        data: {
          userId: newUser.id,
          roleId: userRole.id,
          assignedBy: parseInt(req.user?.userId || '0')

        }
      });

      return newUser;
    });

    sendResponse(
      res,
      true,
      result,
      'User registered successfully',
      STATUS_CODES.CREATED
    );
  } catch (error) {
    sendResponse(
      res,
      false,
      null,
      'Registration failed',
      STATUS_CODES.SERVER_ERROR
    );
  }




}
