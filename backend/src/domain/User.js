// src/models/User.js
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

class User {
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
  canBeSuspended() {
    return this.status === UserStatus.ACTIVE &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  canBeDeactivated() {
    return this.status === UserStatus.ACTIVE &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  canBeReactivated() {
    return this.status === UserStatus.DEACTIVATED &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  canBeUnsuspended() {
    return this.status === UserStatus.SUSPENDED &&
           (this.role === Role.ELDERLY || this.role === Role.VOLUNTEER);
  }

  isManageableByAdmin() {
    return this.role !== Role.ADMIN;
  }

  isActive()      { return this.status === UserStatus.ACTIVE; }
  isSuspended()   { return this.status === UserStatus.SUSPENDED; }
  isDeactivated() { return this.status === UserStatus.DEACTIVATED; }

  // ---- Validation ----
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
