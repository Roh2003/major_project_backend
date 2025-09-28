import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('username').isString().isLength({ min: 3 }),
  body('password').isString().isLength({ min: 6 }),
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty()
];

export const loginValidator = [
  body('email').isEmail(),
  body('password').isString().notEmpty()
];

