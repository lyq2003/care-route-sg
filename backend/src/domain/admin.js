const User = require('./user');
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

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
  
  // Override validation to exclude phone and profile picture requirements for admins
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
