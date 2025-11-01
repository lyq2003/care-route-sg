const User = require('./user');
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

/**
 * Admin user domain model
 * Represents an administrator who can manage users, reports, and system settings
 * Extends the base User class but overrides validation to exclude phone/profile picture requirements
 * 
 * @class Admin
 * @extends User
 * @example
 * const admin = new Admin({
 *   userid: 'admin-123',
 *   fullname: 'Admin User',
 *   email: 'admin@careroute.sg'
 * });
 */
class Admin extends User {
  constructor({
    userid,
    fullname,
    email,
    passwordHash,
    status = UserStatus.ACTIVE,
    role = Role.ADMIN,
    createdAt = new Date(),
    updatedAt = new Date(),

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
      phone: null, // Admins don't need phone numbers
      email,
      passwordHash,
      profilePicture: null, // Admins don't need profile pictures
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
   * Validates admin user data
   * Overrides base User validation to exclude phone and profile picture requirements
   * Admins don't need phone numbers or profile pictures
   * @static
   * @param {Object} adminData - Admin user data to validate
   * @param {string} adminData.email - Admin email (required)
   * @param {string} adminData.fullname - Admin full name (required, min 2 chars)
   * @param {string} [adminData.passwordHash] - Hashed password (or password for new accounts)
   * @param {string} [adminData.password] - Plain password (for new accounts)
   * @param {UserStatus} [adminData.status] - Admin status (must be valid enum value)
   * @param {Role} [adminData.role] - Must be Role.ADMIN
   * @returns {Object} Validation result with isValid flag and errors array
   * @returns {boolean} returns.isValid - True if validation passed
   * @returns {string[]} returns.errors - Array of validation error messages
   */
  static validate(adminData) {
    const errors = [];

    if (!adminData.email) {
      errors.push('Email is required');
    }
    if (!adminData.fullname || adminData.fullname.trim().length < 2) {
      errors.push('Full name is required and must be at least 2 characters');
    }
    if (!adminData.passwordHash && !adminData.password) {
      errors.push('Password is required');
    }
    if (adminData.status && !Object.values(UserStatus).includes(adminData.status)) {
      errors.push(`Invalid status. Must be one of: ${Object.values(UserStatus).join(', ')}`);
    }
    if (adminData.role && adminData.role !== Role.ADMIN) {
      errors.push('Role must be ADMIN for admin accounts');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (adminData.email && !emailRegex.test(adminData.email)) {
      errors.push('Invalid email format');
    }

    return { isValid: errors.length === 0, errors };
  }
}

module.exports = Admin;
