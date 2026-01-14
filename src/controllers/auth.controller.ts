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

export const register = async (req: Request, res: Response): Promise<void> => {

  console.log("Register API called");
  console.log("Request body:", req.body);

  const {
    firstName,
    lastName,
    phoneNo,
    email,
    username,
    password
  } = req.body;

  console.log("Finding user role...");
  let userRole;
  try {
    userRole = await prisma.roles.findFirst({
      where: {
        name: "User"
      }
    })
    console.log("User role fetched:", userRole);
  } catch (err) {
    console.error("Error fetching user role:", err);
    sendResponse(
      res,
      false,
      null,
      'Error while fetching USER role from database',
      STATUS_CODES.SERVER_ERROR
    );
    return;
  }

  if (!userRole) {
    console.log("USER role not found in database");
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
    console.log("Validating password...");
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log("Password validation failed");
      sendResponse(
        res,
        false,
        null,
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }
    console.log("Password validation passed");
  }

  if (email) {
    console.log("Validating email...");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Email validation failed");
      sendResponse(
        res,
        false,
        null,
        'Email must be a valid email address',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }
    console.log("Email validation passed");
  }

  try {
    console.log("Creating user and role mapping inside transaction...");
    const result = await prisma.$transaction(async (tx) => {
      console.log("Hashing password...");
      const hashedPwd = await hashPassword(password);
      console.log("Password hashed.");

      console.log("Creating user...");
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          phoneNo,
          email,
          username,
          password: hashedPwd,
          isActive: true,
          isDeleted: false,
        }
      });
      console.log("User created:", newUser);

      console.log("Creating user-role mapping...");
      await tx.userRoleMapping.create({
        data: {
          userId: newUser.id,
          roleId: userRole.id,
        }
      });
      console.log("User-role mapping created.");

      return newUser;
    });

    console.log("Transaction complete. Sending response...");
    sendResponse(
      res,
      true,
      result,
      'User registered successfully',
      STATUS_CODES.CREATED
    );
  } catch (error) {
    console.error("Registration failed:", error);
    sendResponse(
      res,
      false,
      null,
      'Registration failed',
      STATUS_CODES.SERVER_ERROR
    );
  }

}
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  console.log("api is hitting in backend")

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

  console.log("api is hitting in backend 2")


  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoleMappings: {
          include: {
            role: true
          }
        }
      }
    });

    console.log("api is hitting in backend 3")


    if (!user) {
      sendResponse(
        res,
        false,
        null,
        'Invalid email or password',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    console.log("api is hitting in backend 4")

    if (user.isDeleted) {
      sendResponse(
        res,
        false,
        null,
        'Your account has been deleted',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    console.log("api is hitting in backend 5")
    
    if (!user.isActive) {
      sendResponse(
        res,
        false,
        null,
        'Your account is not active',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    console.log("api is hitting in backend 6")

    // Assume you have a comparePassword util
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      sendResponse(
        res,
        false,
        null,
        'Invalid email or password',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    console.log("api is hitting in backend 7")
    console.log("user", user.userRoleMappings[0].role.name)

    // Generate access token and refresh token (assume you have generateToken util)
    const accessToken = generateToken(
      {userId: user.id, email: user.email, username: user.username, role: user.userRoleMappings[0].role.name},
      '1h'
    );

    console.log("accessToken", accessToken)

    sendResponse(
      res,
      true,
      { 
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          phoneNo: user.phoneNo,
        },
        accessToken
      },
      'Login successful',
      STATUS_CODES.OK
    );
  } catch (error) {
    sendResponse(
      res,
      false,
      null,
      'Login failed',
      STATUS_CODES.SERVER_ERROR
    );
  }
}

// Admin Login - specifically for admin dashboard
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  console.log("[Admin Login] API called");
  console.log("[Admin Login] Email:", email);

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
    // Find user with role mappings
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoleMappings: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.log("[Admin Login] User not found");
      sendResponse(
        res,
        false,
        null,
        'Invalid email or password',
        STATUS_CODES.BAD_REQUEST
      );
      return;
    }

    // Check if user is deleted or inactive
    if (user.isDeleted) {
      sendResponse(
        res,
        false,
        null,
        'Your account has been deleted',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    if (!user.isActive) {
      sendResponse(
        res,
        false,
        null,
        'Your account is not active',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    // Check if user has admin role
    const roles = user.userRoleMappings.map(mapping => mapping.role.name);
    const isAdmin = roles.includes('ADMIN') || roles.includes('admin') || roles.includes('SUPERADMIN') || roles.includes('superAdmin');

    console.log("[Admin Login] User roles:", roles);
    console.log("[Admin Login] Is admin:", isAdmin);

    if (!isAdmin) {
      sendResponse(
        res,
        false,
        null,
        'Access denied. Admin privileges required.',
        STATUS_CODES.FORBIDDEN
      );
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log("[Admin Login] Invalid password");
      sendResponse(
        res,
        false,
        null,
        'Invalid email or password',
        STATUS_CODES.UNAUTHORIZED
      );
      return;
    }

    // Generate access token with role information
    const accessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: roles[0] // Primary role
      },
      '8h' // Longer session for admins
    );

    console.log("[Admin Login] Login successful");

    sendResponse(
      res,
      true,
      {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          role: roles[0]
        },
        accessToken
      },
      'Admin login successful',
      STATUS_CODES.OK
    );
  } catch (error) {
    console.error("[Admin Login] Error:", error);
    sendResponse(
      res,
      false,
      null,
      'Login failed',
      STATUS_CODES.SERVER_ERROR
    );
  }
}
