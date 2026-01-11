import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').isString().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').isString().notEmpty().withMessage('First name is required'),
  body('lastName').isString().notEmpty().withMessage('Last name is required'),
  body('phoneNo').isInt().withMessage('Phone number must be an integer'),
  // body('address').isString().notEmpty().withMessage('Address is required'),
  // body('dateOfBirth').isISO8601().toDate().withMessage('Date of birth must be a valid date'),
  // body('gender').isString().notEmpty().withMessage('Gender is required'),
  // body('state').isString().notEmpty().withMessage('State is required'),
  // body('country').isString().notEmpty().withMessage('Country is required'),
  // body('currenrStudyLevel').isIn([
  //   'PRIMARY_SCHOOL',
  //   'MIDDLE_SCHOOL',
  //   'HIGH_SCHOOL',
  //   'SENIOR_SECONDARY',
  //   'UNDERGRADUATE',
  //   'POSTGRADUATE',
  //   'DOCTORATE'
  // ]).withMessage('Current study level is invalid')
];

export const loginValidator = [
  body('email').isEmail(),
  body('username').isString().optional(),
  body('password').isString().notEmpty()
];
