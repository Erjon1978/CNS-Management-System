const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  };
};

// System validation rules
const validateSystem = [
  body('name').notEmpty().withMessage('System name is required'),
  body('systemType').notEmpty().withMessage('System type is required'),
  body('manufacturer').notEmpty().withMessage('Manufacturer is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('location.site').notEmpty().withMessage('Site is required')
];

// Task validation rules
const validateTask = [
  body('title').notEmpty().withMessage('Task title is required'),
  body('system').notEmpty().withMessage('System is required'),
  body('taskType').notEmpty().withMessage('Task type is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
];

// Incident validation rules
const validateIncident = [
  body('title').notEmpty().withMessage('Incident title is required'),
  body('system').notEmpty().withMessage('System is required'),
  body('incidentType').notEmpty().withMessage('Incident type is required')
];

// User validation rules (used for updates only — user creation goes through
// POST /api/auth/register, which has its own validators). Fields are optional
// since an update may only touch some of them, and password is intentionally
// excluded: this endpoint never updates passwords (the controller strips it).
const validateUser = [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('firstName').optional().notEmpty().withMessage('First name is required'),
  body('lastName').optional().notEmpty().withMessage('Last name is required')
];

// Training validation rules
const validateTraining = [
  body('name').notEmpty().withMessage('Training name is required'),
  body('type').notEmpty().withMessage('Training type is required'),
  body('schedule.startDate').isISO8601().withMessage('Valid start date is required'),
  body('schedule.endDate').isISO8601().withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.schedule.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive number')
];

module.exports = {
  validate,
  validateSystem,
  validateTask,
  validateIncident,
  validateUser,
  validateTraining // Add this
};