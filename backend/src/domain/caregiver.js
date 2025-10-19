const User = require('./user');
const UserStatus = require('./enum/UserStatus');
const Role = require('./enum/Role');

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

  static validate(cgData = {}) {
    const base = User.validate(cgData);
    const errors = [...base.errors];
    // Caregiver-specific (none strictly required beyond User core fields)
    return { isValid: errors.length === 0, errors };
  }
}

module.exports = Caregiver;