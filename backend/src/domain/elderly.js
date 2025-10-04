// CommonJS version

const User = require('./user');
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

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
  canGenerateLinkPIN() {
    return this.isActive();
  }

  generateNewPIN() {
    if (!this.canGenerateLinkPIN()) {
      throw new Error('Cannot generate PIN: account not active');
    }
    this.linkingPIN = Math.floor(100000 + Math.random() * 900000).toString();
    return this.linkingPIN;
  }

  // You can extend validation if needed
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
