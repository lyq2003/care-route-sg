const User = require('./user');
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

/**
 * Caregiver user domain model
 * Represents a caregiver who can link to and monitor elderly users
 * Extends the base User class
 * 
 * @class Caregiver
 * @extends User
 * @example
 * const caregiver = new Caregiver({
 *   userid: 'caregiver-123',
 *   fullname: 'John Smith',
 *   email: 'john@example.com',
 *   phone: '+6512345678'
 * });
 */
class Caregiver extends User {
  constructor({
    userid,
    fullname,
    phone,
    email,
    passwordHash,
    profilePicture,
    status = UserStatus.ACTIVE,
    role = Role.CAREGIVER,
    createdAt = new Date(),
    updatedAt = new Date(),
  } = {}) {
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
    });
  }

  /**
   * Validates caregiver user data
   * Uses base User validation (no additional caregiver-specific requirements)
   * @static
   * @param {Object} [cgData={}] - Caregiver user data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   * @returns {boolean} returns.isValid - True if validation passed
   * @returns {string[]} returns.errors - Array of validation error messages
   */
  static validate(cgData = {}) {
    const base = User.validate(cgData);
    const errors = [...base.errors];
    // Caregiver-specific (none strictly required beyond User core fields)
    return { isValid: errors.length === 0, errors };
  }
}

module.exports = Caregiver;