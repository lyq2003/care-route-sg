// User domain model with status constants and validation
class User {
  constructor({
    userid,
    fullname,
    phone,
    email,
    passwordHash,
    profilePicture,
    status = 'active',
    role,
    createdAt,
    updatedAt,
    // Additional admin fields for tracking actions
    suspendedAt,
    suspensionReason,
    suspensionDuration,
    suspensionEndDate,
    deactivatedAt,
    deactivationReason,
    bannedAt,
    banReason,
    // Profile fields
    online = false
  }) {
    this.userid = userid;
    this.fullname = fullname;
    this.phone = phone;
    this.email = email;
    this.passwordHash = passwordHash;
    this.profilePicture = profilePicture;
    this.status = status;
    this.role = role;
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
    // Profile fields
    this.online = online;
  }

  // User status constants (UserStatus enum)
  static STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended', 
    DEACTIVATED: 'deactivated'
  };

  // User roles (if needed for admin operations)
  static ROLES = {
    ELDERLY: 'elderly',
    VOLUNTEER: 'volunteer',
    CAREGIVER: 'caregiver',
    ADMIN: 'admin'
  };

  // Check if user can be suspended (Elderly and Volunteers only)
  canBeSuspended() {
    return this.status === User.STATUS.ACTIVE && 
           (this.role === User.ROLES.ELDERLY || 
            this.role === User.ROLES.VOLUNTEER);
  }

  // Check if user can be deactivated (Elderly and Volunteers only)
  canBeDeactivated() {
    return this.status === User.STATUS.ACTIVE && 
           (this.role === User.ROLES.ELDERLY || 
            this.role === User.ROLES.VOLUNTEER);
  }

  // Check if user can be reactivated (only deactivated elderly/volunteers for manual admin reactivation)
  canBeReactivated() {
    return this.status === User.STATUS.DEACTIVATED &&
           (this.role === User.ROLES.ELDERLY || 
            this.role === User.ROLES.VOLUNTEER);
  }

  // Check if user can be auto-unsuspended (only suspended elderly/volunteers for automatic unsuspension)
  canBeUnsuspended() {
    return this.status === User.STATUS.SUSPENDED &&
           (this.role === User.ROLES.ELDERLY || 
            this.role === User.ROLES.VOLUNTEER);
  }

  // Check if user is manageable by admin (not an admin themselves)
  isManageableByAdmin() {
    return this.role !== User.ROLES.ADMIN;
  }

  // Check if user is active
  isActive() {
    return this.status === User.STATUS.ACTIVE;
  }

  // Check if user is suspended
  isSuspended() {
    return this.status === User.STATUS.SUSPENDED;
  }

  // Check if user is deactivated
  isDeactivated() {
    return this.status === User.STATUS.DEACTIVATED;
  }

  // Validate user data
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

    if (userData.status && !Object.values(User.STATUS).includes(userData.status)) {
      errors.push('Invalid status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = User;