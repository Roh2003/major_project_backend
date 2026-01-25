import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { sendResponse } from '../utils/responseUtils';
import STATUS_CODES from '../utils/statusCodes';
import { hashPassword } from '../utils/password';
import { comparePassword } from '../utils/authUtils';
import { generateToken } from '../utils/generateToken';

/**
 * Tutor Signup
 */
export const tutorSignup = async (req: Request, res: Response): Promise<void> => {
  console.log("[Tutor Signup] API called");
  console.log("[Tutor Signup] Request body:", req.body);

  const {
    firstName,
    lastName,
    phoneNo,
    email,
    username,
    password,
    bio,
    specialization,
    experience,
    qualification
  } = req.body;

  // Validate required fields
  if (!email || !username || !password) {
    sendResponse(
      res,
      false,
      null,
      'Email, username, and password are required',
      STATUS_CODES.BAD_REQUEST
    );
    return;
  }

  // Validate password
  if (password) {
    console.log("Validating password...");
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

  // Validate email
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
    // Check if tutor already exists
    const existingTutor = await prisma.tutor.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingTutor) {
      sendResponse(
        res,
        false,
        null,
        'Email or username already exists',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }

    // Hash password
    const hashedPwd = await hashPassword(password);

    // Create tutor
    const newTutor = await prisma.tutor.create({
      data: {
        firstName,
        lastName,
        phoneNo,
        email,
        username,
        password: hashedPwd,
        bio,
        specialization,
        experience,
        qualification,
        isActive: true,
        isDeleted: false,
        totalEarnings: 0,
        pendingEarnings: 0,
        coursesCreated: 0
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        phoneNo: true,
        bio: true,
        specialization: true,
        experience: true,
        qualification: true,
        createdAt: true
      }
    });

    console.log("[Tutor Signup] Tutor created successfully");

    sendResponse(
      res,
      true,
      newTutor,
      'Tutor registered successfully',
      STATUS_CODES.CREATED
    );
  } catch (error) {
    console.error("[Tutor Signup] Error:", error);
    sendResponse(
      res,
      false,
      null,
      'Registration failed',
      STATUS_CODES.SERVER_ERROR
    );
  }
};

/**
 * Tutor Login
 */
export const tutorLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  console.log("[Tutor Login] API called");
  console.log("[Tutor Login] Email:", email);

  if (!email || !password) {
    sendResponse(
      res,
      false,
      null,
      'Email and password are required',
      STATUS_CODES.BAD_REQUEST
    );
    return;
  }

  try {
    // Find tutor by email
    const tutor = await prisma.tutor.findUnique({
      where: { email }
    });

    if (!tutor) {
      console.log("[Tutor Login] Tutor not found");
      sendResponse(
        res,
        false,
        null,
        'Invalid email or password',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    // Check if account is deleted or inactive
    if (tutor.isDeleted) {
      sendResponse(
        res,
        false,
        null,
        'Your account has been deleted',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    if (!tutor.isActive) {
      sendResponse(
        res,
        false,
        null,
        'Your account is not active',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, tutor.password);
    if (!isPasswordValid) {
      console.log("[Tutor Login] Invalid password");
      sendResponse(
        res,
        false,
        null,
        'Invalid email or password',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    // Generate access token
    const authToken = generateToken(
      {
        tutorId: tutor.id,
        email: tutor.email,
        username: tutor.username,
        role: 'TUTOR'
      },
      '8h'
    );

    console.log("[Tutor Login] Login successful");

    sendResponse(
      res,
      true,
      {
        tutor: {
          id: tutor.id,
          firstName: tutor.firstName,
          lastName: tutor.lastName,
          email: tutor.email,
          username: tutor.username,
          phoneNo: tutor.phoneNo,
          bio: tutor.bio,
          specialization: tutor.specialization,
          experience: tutor.experience,
          totalEarnings: tutor.totalEarnings,
          coursesCreated: tutor.coursesCreated
        },
        authToken
      },
      'Login successful',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error("[Tutor Login] Error:", error);
    sendResponse(
      res,
      false,
      null,
      'Login failed',
      STATUS_CODES.SERVER_ERROR
    );
  }
};

/**
 * Get Tutor Profile
 */
export const getTutorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Get Tutor Profile] API called');
    
    const tutorId = req.user?.tutorId;

    if (!tutorId) {
      sendResponse(
        res,
        false,
        null,
        'Tutor ID not found',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }

    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: {
        courses: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            createdAt: true
          }
        }
      }
    });

    if (!tutor) {
      sendResponse(
        res,
        false,
        null,
        'Tutor not found',
        STATUS_CODES.NOT_FOUND
      );
      return;
    }

    sendResponse(
      res,
      true,
      tutor,
      'Profile retrieved successfully',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[Get Tutor Profile] Error:', error);
    sendResponse(
      res,
      false,
      null,
      'Failed to retrieve profile',
      STATUS_CODES.SERVER_ERROR
    );
  }
};

/**
 * Update Tutor Profile
 */
export const updateTutorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[Update Tutor Profile] API called');

    const tutorId = req.user?.tutorId;

    if (!tutorId) {
      sendResponse(
        res,
        false,
        null,
        'Tutor ID not found',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }

    const {
      firstName,
      lastName,
      phoneNo,
      address,
      dateOfBirth,
      gender,
      state,
      country,
      profileImage,
      bio,
      specialization,
      experience,
      qualification
    } = req.body;

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNo !== undefined) updateData.phoneNo = phoneNo;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (gender !== undefined) updateData.gender = gender;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (bio !== undefined) updateData.bio = bio;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (experience !== undefined) updateData.experience = experience;
    if (qualification !== undefined) updateData.qualification = qualification;

    const updatedTutor = await prisma.tutor.update({
      where: { id: tutorId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNo: true,
        address: true,
        dateOfBirth: true,
        gender: true,
        state: true,
        country: true,
        profileImage: true,
        email: true,
        username: true,
        bio: true,
        specialization: true,
        experience: true,
        qualification: true
      }
    });

    sendResponse(
      res,
      true,
      updatedTutor,
      'Profile updated successfully',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error('[Update Tutor Profile] Error:', error);
    sendResponse(
      res,
      false,
      null,
      'Failed to update profile',
      STATUS_CODES.SERVER_ERROR
    );
  }
};
