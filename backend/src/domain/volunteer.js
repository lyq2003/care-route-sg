const User = require('./user');
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

/**
 * Volunteer user domain model
 * Represents a volunteer who can accept and fulfill help requests from elderly users
 * Extends the base User class
 * 
 * @class Volunteer
 * @extends User
 * @example
 * const volunteer = new Volunteer({
 *   userid: 'volunteer-123',
 *   fullname: 'Alice Johnson',
 *   email: 'alice@example.com',
 *   phone: '+6512345678'
 * });
 */
class Volunteer extends User {
  constructor({
    userid,
    fullname,
    phone,
    email,
    passwordHash,
    profilePicture,
    status = UserStatus.ACTIVE,
    role = Role.VOLUNTEER,
    createdAt = new Date(),
    updatedAt = new Date(),

    // Admin tracking
    suspendedAt = null,
    suspensionReason = null,
    suspensionDuration = 0,
    suspensionEndDate = null,
    deactivatedAt = null,
    deactivationReason = null,
    bannedAt = null,
    banReason = null,

    // Profile
    online = false
  }) {
    super({
      userid,
      fullname,
      phone,
      email,
      passwordHash,
      profilePicture,
      status,
      role,
      createdAt,
      updatedAt,
      suspendedAt,
      suspensionReason,
      suspensionDuration,
      suspensionEndDate,
      deactivatedAt,
      deactivationReason,
      bannedAt,
      banReason,
      online
    });
  }

  /**
   * Validates volunteer user data
   * Extends base User validation (currently same as base validation)
   * @static
   * @param {Object} volunteerData - Volunteer user data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   * @returns {boolean} returns.isValid - True if validation passed
   * @returns {string[]} returns.errors - Array of validation error messages
   */
  static validate(volunteerData) {
    const baseValidation = User.validate(volunteerData);
    const errors = [...baseValidation.errors];

    // Note: Mobility preference validation removed as it's elderly-specific
    // Add volunteer-specific validations here if needed

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Volunteer;