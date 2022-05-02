const { validateResult } = require('../utils');
const { check } = require('express-validator');

/**
 * Validates register request
 */
/**
 * Validates login request
 */
const validateAddStaker = [
    check('staker').exists().withMessage('MISSING').not().isEmpty().withMessage('IS_EMPTY'),
    check('mintAddr').exists().withMessage('MISSING').not().isEmpty().withMessage('IS_EMPTY'),
    (req, res, next) => {
        validateResult(req, res, next);
    },
];

module.exports = { validateAddStaker };
