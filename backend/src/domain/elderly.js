const User = require('./user');
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

/**
 * Elderly user domain model
 * Represents an elderly user who can request help and navigation assistance
 * Extends the base User class with elderly-specific functionality like linking PINs
 * 
 * @class Elderly
 * @extends User
 * @example
 * const elderly = new Elderly({
 *   userid: 'elderly-123',
 *   fullname: 'Jane Doe',
 *   email: 'jane@example.com',
 *   phone: '+6512345678',
 *   mobilityPreference: 'wheelchair',
 *   linkingPIN: '123456'
 * });
 */
class Elderly extends User {
  constructor({
    userid,
    fullname,
    phone,
    email,
    passwordHash,
    profilePicture,
    status = UserStatus.ACTIVE,
    role = Role.ELDERLY,
    createdAt = new Date(),
    updatedAt = new Date(),

    // Elderly-specific fields
    mobilityPreference = 'unknown',
    linkingPIN = null,

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

    this.mobilityPreference = mobilityPreference;
    this.linkingPIN = linkingPIN;
  }

  // Example domain methods
  
  /**
   * Checks if a linking PIN can be generated for this elderly user
   * PINs can only be generated for active accounts
   * @returns {boolean} True if PIN can be generated
   */
  canGenerateLinkPIN() {
    return this.isActive();
  }

  /**
   * Generates a new 6-digit linking PIN for caregiver association
   * @returns {string} 6-digit PIN string
   * @throws {Error} If account is not active
   * @example
   * if (elderly.canGenerateLinkPIN()) {
   *   const pin = elderly.generateNewPIN();
   *   console.log(`Your linking PIN is: ${pin}`);
   * }
   */
  generateNewPIN() {
    if (!this.canGenerateLinkPIN()) {
      throw new Error('Cannot generate PIN: account not active');
    }
    this.linkingPIN = Math.floor(100000 + Math.random() * 900000).toString();
    return this.linkingPIN;
  }

  /**
   * Validates elderly user data
   * Extends base User validation with elderly-specific requirements
   * @static
   * @param {Object} elderlyData - Elderly user data to validate
   * @param {string} elderlyData.mobilityPreference - Mobility preference (required)
   * @returns {Object} Validation result with isValid flag and errors array
   * @returns {boolean} returns.isValid - True if validation passed
   * @returns {string[]} returns.errors - Array of validation error messages
   */
  static validate(elderlyData) {
    const baseValidation = User.validate(elderlyData);
    const errors = [...baseValidation.errors];

    if (!elderlyData.mobilityPreference) {
      errors.push('Mobility preference is required.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = Elderly;
