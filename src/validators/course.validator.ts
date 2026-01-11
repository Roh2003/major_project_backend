import { body } from 'express-validator';


export const courseCreateValidator = [
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('thumbnailUrl').optional().isURL().withMessage('ThumbnailUrl must be a valid URL'),
    body('level').isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).withMessage('Level is invalid'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('language').optional().isString().withMessage('Language must be a string'),
    body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
    body('instructor').isString().notEmpty().withMessage('Instructor is required'),
    body('duration').isString().optional().withMessage('Duration must be a string'),
];
  