// src/models/User.js
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

/**
 * Base User domain model
 * Represents a user in the CareRoute system with common properties and behaviors
 * All user roles (Elderly, Caregiver, Volunteer, Admin) extend this class
 * 
 * @class User
 * @example
 * const user = new User({
 *   userid: '123',
 *   fullname: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+6512345678',
 *   role: Role.ELDERLY,
 *   status: UserStatus.ACTIVE
 * });
 */
class User {
  /**
   * Creates a new User instance
   * @param {Object} options - User configuration object
   * @param {string} options.userid - Unique user identifier
   * @param {string} options.fullname - User's full name
   * @param {string} options.phone - User's phone number
   * @param {string} options.email - User's email address
   * @param {string} [options.passwordHash] - Hashed password (not stored in domain model)
   * @param {string} [options.profilePicture] - URL to user's profile picture
   * @param {UserStatus} [options.status=UserStatus.ACTIVE] - Account status
   * @param {Role} options.role - User role (ELDERLY, CAREGIVER, VOLUNTEER, ADMIN)
   * @param {Date} [options.createdAt=new Date()] - Account creation timestamp
   * @param {Date} [options.updatedAt=new Date()] - Last update timestamp
   * @param {Date} [options.suspendedAt=null] - Suspension start timestamp
   * @param {string} [options.suspensionReason=null] - Reason for suspension
   * @param {number} [options.suspensionDuration=0] - Suspension duration in days
   * @param {Date} [options.suspensionEndDate=null] - Suspension end date
   * @param {Date} [options.deactivatedAt=null] - Deactivation timestamp
   * @param {string} [options.deactivationReason=null] - Reason for deactivation
   * @param {Date} [options.bannedAt=null] - Ban timestamp
   * @param {string} [options.banReason=null] - Reason for ban
   * @param {boolean} [options.online=false] - Online status flag
   */
  constructor({
    userid,
    fullname,
    phone,
    email,
    passwordHash,
    profilePicture,
    status = UserStatus.ACTIVE,
    role,
    createdAt = new Date(),
    updatedAt = new Date(),

    // Admin tracking fields
    suspendedAt = null,
    suspensionReason = null,
    suspensionDuration = 0,   // default 0 days
    suspensionEndDate = null,
    deactivatedAt = null,
    deactivationReason = null,
    bannedAt = null,
    banReason = null,

    // Profile fields
    online = false,
  }) {
    this.userid = userid;
    this.fullname = fullname;
    this.phone = phone;
    this.email = email;
    this.passwordHash = passwordHash;
    this.profilePicture = profilePicture;

    this.status = status;  // expects value from UserStatus enum
    this.role = role;      // expects value from Role enum
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    // Admin tracking fields
    this.suspendedAt = suspendedAt;
    this.suspensionReason = suspensionReason;
    this.suspensionDuration = suspensionDuration;
    this.suspensionEndDate = suspensionEndDate;
    this.deactivatedAt = deactivatedAt;
    this.deactivationReason = deactivationReason;
    this.bannedAt = bannedAt;
    this.banReason = banReason;

    // Profile
    this.online = online;
  }

  // ---- Domain checks ----
  
  /**
   * Checks if user can be suspended
   * Only active Elderly and Volunteer users can be suspended
   * @returns {boolean} True if user can be suspended
   */
  canBeSuspended() {
    return this.status === UserStatus.ACTIVE &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  /**
   * Checks if user can be deactivated
   * Only active Elderly and Volunteer users can be deactivated
   * @returns {boolean} True if user can be deactivated
   */
  canBeDeactivated() {
    return this.status === UserStatus.ACTIVE &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  /**
   * Checks if user can be reactivated
   * Only deactivated Elderly and Volunteer users can be reactivated
   * @returns {boolean} True if user can be reactivated
   */
  canBeReactivated() {
    return this.status === UserStatus.DEACTIVATED &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  /**
   * Checks if user can be unsuspended
   * Only suspended Elderly and Volunteer users can be unsuspended
   * @returns {boolean} True if user can be unsuspended
   */
  canBeUnsuspended() {
    return this.status === UserStatus.SUSPENDED &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  /**
   * Checks if user can be managed by admin
   * Admins cannot be managed by other admins
   * @returns {boolean} True if user is manageable by admin
   */
  isManageableByAdmin() {
    return this.role !== Role.ADMIN;
  }

  /**
   * Checks if user status is ACTIVE
   * @returns {boolean} True if user is active
   */
  isActive() { return this.status === UserStatus.ACTIVE; }
  
  /**
   * Checks if user status is SUSPENDED
   * @returns {boolean} True if user is suspended
   */
  isSuspended() { return this.status === UserStatus.SUSPENDED; }
  
  /**
   * Checks if user status is DEACTIVATED
   * @returns {boolean} True if user is deactivated
   */
  isDeactivated() { return this.status === UserStatus.DEACTIVATED; }

  // ---- Validation ----
  
  /**
   * Validates user data
   * @static
   * @param {Object} userData - User data to validate
   * @param {string} userData.email - User email (required)
   * @param {string} userData.fullname - User full name (required, min 2 chars)
   * @param {string} userData.phone - User phone number (required)
   * @param {UserStatus} [userData.status] - User status (must be valid enum value)
   * @param {Role} [userData.role] - User role (must be valid enum value)
   * @returns {Object} Validation result with isValid flag and errors array
   * @returns {boolean} returns.isValid - True if validation passed
   * @returns {string[]} returns.errors - Array of validation error messages
   * @example
   * const result = User.validate({
   *   email: 'user@example.com',
   *   fullname: 'John Doe',
   *   phone: '+6512345678'
   * });
   * if (!result.isValid) {
   *   console.log(result.errors);
   * }
   */
  static validate(userData) {
    const errors = [];

    if (!userData.email) {
      errors.push('Email is required');
    }
    if (!userData.fullname || userData.fullname.trim().length < 2) {
      errors.push('Full name is required and must be at least 2 characters');
    }
    if (!userData.phone) {
      errors.push('Phone number is required');
    }
    if (userData.status && !Object.values(UserStatus).includes(userData.status)) {
      errors.push(`Invalid status. Must be one of: ${Object.values(UserStatus).join(', ')}`);
    }
    if (userData.role && !Object.values(Role).includes(userData.role)) {
      errors.push(`Invalid role. Must be one of: ${Object.values(Role).join(', ')}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = User;
