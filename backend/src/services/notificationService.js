const { supabase } = require('../config/supabase');
const { getReceiverSocketId, io } = require('../middleware/socket');

/**
 * Notification Service for Elderly Users and Caregivers
 * Handles real-time and persistent notifications for various events
 */
class NotificationService {
  
  /**
   * Send notification to elderly user
   * @param {string} elderlyId - The elderly user ID
   * @param {string} message - The notification message
   * @param {object} metadata - Additional metadata (optional)
   */
  async sendNotification(elderlyId, message, metadata = {}) {
    try {
      // Store notification in database
      await supabase.from('notifications').insert([
        {
          elderly_id: elderlyId,
          message,
          metadata,
          created_at: new Date().toISOString(),
          is_read: false
        }
      ]);

      // Send real-time notification via socket if user is online
      const elderlySocketId = getReceiverSocketId(elderlyId);
      if (elderlySocketId) {
        io.to(elderlySocketId).emit('notify', { message, metadata });
      }

      console.log(`Notification sent to elderly ${elderlyId}: ${message}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      // Don't throw error - notification failure shouldn't break main operation
    }
  }

  /**
   * Send notification to caregiver user
   * @param {string} caregiverId - The caregiver user ID
   * @param {string} message - The notification message
   * @param {object} metadata - Additional metadata (optional)
   */
  async sendCaregiverNotification(caregiverId, message, metadata = {}) {
    try {
      // Store notification in database
      await supabase.from('notifications').insert([
        {
          caregiver_id: caregiverId,
          message,
          metadata,
          created_at: new Date().toISOString(),
          is_read: false
        }
      ]);

      // Send real-time notification via socket if user is online
      const caregiverSocketId = getReceiverSocketId(caregiverId);
      if (caregiverSocketId) {
        io.to(caregiverSocketId).emit('notify', { message, metadata });
      }

      console.log(`Notification sent to caregiver ${caregiverId}: ${message}`);
    } catch (error) {
      console.error('Error sending caregiver notification:', error);
      // Don't throw error - notification failure shouldn't break main operation
    }
  }

  /**
   * 1. Account created - Welcome message with linking PIN
   */
  async notifyAccountCreated(elderlyId, linkingPin) {
    const message = `Welcome to CareRoute! Your linking PIN is ${linkingPin}.`;
    await this.sendNotification(elderlyId, message, {
      type: 'ACCOUNT_CREATED',
      linkingPin
    });
  }

  /**
   * 2. Caregiver linked - Notify when caregiver links to account
   */
  async notifyCaregiverLinked(elderlyId, caregiverName) {
    const message = `Your caregiver ${caregiverName} has linked to your account.`;
    await this.sendNotification(elderlyId, message, {
      type: 'CAREGIVER_LINKED',
      caregiverName
    });
  }

  /**
   * 3. Help request created - Confirmation of submission
   */
  async notifyHelpRequestCreated(elderlyId, requestId) {
    const message = 'Your help request has been submitted and is pending review.';
    await this.sendNotification(elderlyId, message, {
      type: 'HELP_REQUEST_CREATED',
      requestId
    });
  }

  /**
   * 4. Help request matched - Volunteer accepted request
   */
  async notifyHelpRequestMatched(elderlyId, volunteerId, volunteerName) {
    const message = `A volunteer (${volunteerName}) has accepted your help request.`;
    await this.sendNotification(elderlyId, message, {
      type: 'HELP_REQUEST_MATCHED',
      volunteerId,
      volunteerName
    });
  }

  /**
   * 5. Help request completed - Request marked as completed
   */
  async notifyHelpRequestCompleted(elderlyId, requestId, volunteerName) {
    const message = 'Your help request has been marked as completed.';
    await this.sendNotification(elderlyId, message, {
      type: 'HELP_REQUEST_COMPLETED',
      requestId,
      volunteerName
    });
  }

  /**
   * 6. Review reminder - Prompt to review volunteer
   */
  async notifyReviewReminder(elderlyId, requestId, volunteerName) {
    const message = `You can now review your volunteer for the last help request.`;
    await this.sendNotification(elderlyId, message, {
      type: 'REVIEW_REMINDER',
      requestId,
      volunteerName
    });
  }

  /**
   * 7. Report update - Report status changed
   */
  async notifyReportUpdate(elderlyId, reportId, status, message = null) {
    let notificationMessage;
    
    if (status === 'IN_PROGRESS') {
      notificationMessage = message || 'Your report has been updated to status: In Progress.';
    } else if (status === 'RESOLVED') {
      notificationMessage = message || 'Report resolved – action taken.';
    } else if (status === 'REJECTED') {
      notificationMessage = message || 'Your report has been reviewed and closed.';
    } else {
      notificationMessage = message || `Your report status has been updated to: ${status}.`;
    }
    
    await this.sendNotification(elderlyId, notificationMessage, {
      type: 'REPORT_UPDATE',
      reportId,
      status
    });
  }

  /**
   * 8. Account suspended - Notify of suspension
   */
  async notifyAccountSuspended(elderlyId, duration, reason) {
    const message = `Your account has been suspended for ${duration} days due to ${reason}.`;
    await this.sendNotification(elderlyId, message, {
      type: 'ACCOUNT_SUSPENDED',
      duration,
      reason
    });
  }

  /**
   * Additional: Account unsuspended - Notify when suspension is lifted
   */
  async notifyAccountUnsuspended(elderlyId) {
    const message = 'Your account suspension has been lifted. Welcome back to CareRoute!';
    await this.sendNotification(elderlyId, message, {
      type: 'ACCOUNT_UNSUSPENDED'
    });
  }

  /**
   * Additional: Account deactivated - Notify of deactivation
   */
  async notifyAccountDeactivated(elderlyId, reason) {
    const message = `Your account has been deactivated due to ${reason}.`;
    await this.sendNotification(elderlyId, message, {
      type: 'ACCOUNT_DEACTIVATED',
      reason
    });
  }

  // ==================== CAREGIVER NOTIFICATIONS ====================

  /**
   * CAREGIVER 1: Elderly linked - When caregiver successfully links to elderly
   */
  async notifyCaregiverElderlyLinked(caregiverId, elderlyName) {
    const message = `You are now linked to Elderly user ${elderlyName}.`;
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_ELDERLY_LINKED',
      elderlyName
    });
  }

  /**
   * CAREGIVER 2: Help request initiated by Elderly
   */
  async notifyCaregiverHelpRequestInitiated(caregiverId, elderlyName, requestId, status = 'Pending') {
    const message = `${elderlyName} has created a help request. Current status: ${status}.`;
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_HELP_REQUEST_INITIATED',
      elderlyName,
      requestId,
      status
    });
  }

  /**
   * CAREGIVER 3: Help request matched - Volunteer assigned to elderly's request
   */
  async notifyCaregiverHelpRequestMatched(caregiverId, elderlyName, volunteerName, requestId) {
    const message = `Volunteer ${volunteerName} is assisting ${elderlyName}.`;
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_HELP_REQUEST_MATCHED',
      elderlyName,
      volunteerName,
      requestId
    });
  }

  /**
   * CAREGIVER 4: Trip or help progress updates - Location/progress updates
   */
  async notifyCaregiverProgressUpdate(caregiverId, elderlyName, location, estimatedArrival = null) {
    let message = `${elderlyName}'s current location: ${location}.`;
    if (estimatedArrival) {
      message += ` Estimated arrival ${estimatedArrival}.`;
    }
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_PROGRESS_UPDATE',
      elderlyName,
      location,
      estimatedArrival
    });
  }

  /**
   * CAREGIVER 5: Report status update - When caregiver's report is updated
   */
  async notifyCaregiverReportUpdate(caregiverId, reportId, status, message = null) {
    let notificationMessage;
    
    if (status === 'RESOLVED') {
      notificationMessage = message || 'Your report has been resolved by the Admin.';
    } else if (status === 'IN_PROGRESS') {
      notificationMessage = message || 'Your report is being reviewed by the Admin.';
    } else if (status === 'REJECTED') {
      notificationMessage = message || 'Your report has been closed by the Admin.';
    } else {
      notificationMessage = message || `Your report status has been updated to: ${status}.`;
    }
    
    await this.sendCaregiverNotification(caregiverId, notificationMessage, {
      type: 'CAREGIVER_REPORT_UPDATE',
      reportId,
      status
    });
  }

  /**
   * CAREGIVER 6: Account suspended - When caregiver account is suspended
   */
  async notifyCaregiverAccountSuspended(caregiverId, duration, reason) {
    const message = `Your account has been suspended for ${duration} days due to ${reason}.`;
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_ACCOUNT_SUSPENDED',
      duration,
      reason
    });
  }

  /**
   * Additional: Caregiver account unsuspended
   */
  async notifyCaregiverAccountUnsuspended(caregiverId) {
    const message = 'Your account suspension has been lifted. Welcome back to CareRoute!';
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_ACCOUNT_UNSUSPENDED'
    });
  }

  /**
   * Additional: Caregiver account deactivated
   */
  async notifyCaregiverAccountDeactivated(caregiverId, reason) {
    const message = `Your account has been deactivated due to ${reason}.`;
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_ACCOUNT_DEACTIVATED',
      reason
    });
  }

  /**
   * Additional: Help request completed notification for caregiver
   */
  async notifyCaregiverHelpRequestCompleted(caregiverId, elderlyName, requestId) {
    const message = `${elderlyName}'s help request has been completed.`;
    await this.sendCaregiverNotification(caregiverId, message, {
      type: 'CAREGIVER_HELP_REQUEST_COMPLETED',
      elderlyName,
      requestId
    });
  }

  // ==================== VOLUNTEER NOTIFICATIONS ====================

  /**
   * Send notification to volunteer user
   * @param {string} volunteerId - The volunteer user ID
   * @param {string} message - The notification message
   * @param {object} metadata - Additional metadata (optional)
   */
  async sendVolunteerNotification(volunteerId, message, metadata = {}) {
    try {
      // Store notification in database
      await supabase.from('notifications').insert([
        {
          volunteer_id: volunteerId,
          message,
          metadata,
          created_at: new Date().toISOString(),
          is_read: false
        }
      ]);

      // Send real-time notification via socket if user is online
      const volunteerSocketId = getReceiverSocketId(volunteerId);
      if (volunteerSocketId) {
        io.to(volunteerSocketId).emit('notify', { message, metadata });
      }

      console.log(`Notification sent to volunteer ${volunteerId}: ${message}`);
    } catch (error) {
      console.error('Error sending volunteer notification:', error);
      // Don't throw error - notification failure shouldn't break main operation
    }
  }

  /**
   * VOLUNTEER 1: New help request nearby - When new request is created in volunteer's area
   */
  async notifyVolunteerNewRequestNearby(volunteerId, location, distance, requestId) {
    const message = `New help request available at ${location} (${distance} km away).`;
    await this.sendVolunteerNotification(volunteerId, message, {
      type: 'VOLUNTEER_NEW_REQUEST_NEARBY',
      location,
      distance,
      requestId
    });
  }

  /**
   * VOLUNTEER 2: Request assigned - When volunteer accepts/is assigned to a request
   */
  async notifyVolunteerRequestAssigned(volunteerId, elderlyName, requestId) {
    const message = `You've been matched to Elderly ${elderlyName}'s request.`;
    await this.sendVolunteerNotification(volunteerId, message, {
      type: 'VOLUNTEER_REQUEST_ASSIGNED',
      elderlyName,
      requestId
    });
  }

  /**
   * VOLUNTEER 3: Request cancelled - When assigned request is cancelled
   */
  async notifyVolunteerRequestCancelled(volunteerId, elderlyName = null, requestId) {
    const message = elderlyName 
      ? `${elderlyName}'s help request has been cancelled.`
      : 'Your assigned request has been cancelled.';
    await this.sendVolunteerNotification(volunteerId, message, {
      type: 'VOLUNTEER_REQUEST_CANCELLED',
      elderlyName,
      requestId
    });
  }

  /**
   * VOLUNTEER 4: Request completed - When volunteer completes a task
   */
  async notifyVolunteerRequestCompleted(volunteerId, elderlyName, requestId) {
    const message = 'Task completed successfully. Please leave a review.';
    await this.sendVolunteerNotification(volunteerId, message, {
      type: 'VOLUNTEER_REQUEST_COMPLETED',
      elderlyName,
      requestId
    });
  }

  /**
   * VOLUNTEER 5: Report status update - When volunteer's report is updated
   */
  async notifyVolunteerReportUpdate(volunteerId, reportId, status, message = null) {
    let notificationMessage;
    
    if (status === 'RESOLVED') {
      notificationMessage = message || 'Your report has been marked as Resolved (action taken).';
    } else if (status === 'IN_PROGRESS') {
      notificationMessage = message || 'Your report is being reviewed by the Admin.';
    } else if (status === 'REJECTED') {
      notificationMessage = message || 'Your report has been closed by the Admin.';
    } else {
      notificationMessage = message || `Your report status has been updated to: ${status}.`;
    }
    
    await this.sendVolunteerNotification(volunteerId, notificationMessage, {
      type: 'VOLUNTEER_REPORT_UPDATE',
      reportId,
      status
    });
  }

  /**
   * VOLUNTEER 6: Account suspended - When volunteer account is suspended
   */
  async notifyVolunteerAccountSuspended(volunteerId, duration, reason) {
    const message = `Your account has been suspended for ${duration} days due to ${reason}.`;
    await this.sendVolunteerNotification(volunteerId, message, {
      type: 'VOLUNTEER_ACCOUNT_SUSPENDED',
      duration,
      reason
    });
  }

  /**
   * Additional: Volunteer account unsuspended
   */
  async notifyVolunteerAccountUnsuspended(volunteerId) {
    const message = 'Your account suspension has been lifted. Welcome back to CareRoute!';
    await this.sendVolunteerNotification(volunteerId, message, {
      type: 'VOLUNTEER_ACCOUNT_UNSUSPENDED'
    });
  }

  /**
   * Additional: Volunteer account deactivated
   */
  async notifyVolunteerAccountDeactivated(volunteerId, reason) {
    const message = `Your account has been deactivated due to ${reason}.`;
    await this.sendVolunteerNotification(volunteerId, message, {
      type: 'VOLUNTEER_ACCOUNT_DEACTIVATED',
      reason
    });
  }

  // ==================== ADMIN NOTIFICATIONS ====================

  /**
   * Send notification to admin user
   * @param {string} adminId - The admin user ID
   * @param {string} message - The notification message
   * @param {object} metadata - Additional metadata (optional)
   */
  async sendAdminNotification(adminId, message, metadata = {}) {
    try {
      // Store notification in database
      await supabase.from('notifications').insert([
        {
          admin_id: adminId,
          message,
          metadata,
          created_at: new Date().toISOString(),
          is_read: false
        }
      ]);

      // Send real-time notification via socket if user is online
      const adminSocketId = getReceiverSocketId(adminId);
      if (adminSocketId) {
        io.to(adminSocketId).emit('notify', { message, metadata });
      }

      console.log(`Notification sent to admin ${adminId}: ${message}`);
    } catch (error) {
      console.error('Error sending admin notification:', error);
      // Don't throw error - notification failure shouldn't break main operation
    }
  }

  /**
   * Send notification to all admins
   * @param {string} message - The notification message
   * @param {object} metadata - Additional metadata (optional)
   */
  async notifyAllAdmins(message, metadata = {}) {
    try {
      // Get all admin users
      const { data: admins } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('role', 'ADMIN')
        .eq('status', 'ACTIVE');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          await this.sendAdminNotification(admin.user_id, message, metadata);
        }
      }

      console.log(`Notification sent to all admins: ${message}`);
    } catch (error) {
      console.error('Error sending notification to all admins:', error);
      // Don't throw error - notification failure shouldn't break main operation
    }
  }

  /**
   * ADMIN 1: New user registered - When new user signs up
   */
  async notifyAdminNewUserRegistered(userName, userRole, userId) {
    const message = `New ${userRole} account created: ${userName}.`;
    await this.notifyAllAdmins(message, {
      type: 'ADMIN_NEW_USER_REGISTERED',
      userName,
      userRole,
      userId
    });
  }

  /**
   * ADMIN 2: New report submitted - When report is submitted
   */
  async notifyAdminNewReportSubmitted(reporterName, reporterRole, reportId) {
    const message = `New report submitted by ${reporterRole} ${reporterName}.`;
    await this.notifyAllAdmins(message, {
      type: 'ADMIN_NEW_REPORT_SUBMITTED',
      reporterName,
      reporterRole,
      reportId
    });
  }

  /**
   * ADMIN 3: Report resolved - When admin resolves a report
   */
  async notifyAdminReportResolved(reportId, resolvedBy) {
    const message = `Report #${reportId} has been marked as Resolved.`;
    await this.notifyAllAdmins(message, {
      type: 'ADMIN_REPORT_RESOLVED',
      reportId,
      resolvedBy
    });
  }

  /**
   * ADMIN 4: Review flagged for removal - When review contains offensive content
   */
  async notifyAdminReviewFlagged(reviewId, reason = 'offensive language') {
    const message = `Review #${reviewId} contains ${reason} and was flagged for review.`;
    await this.notifyAllAdmins(message, {
      type: 'ADMIN_REVIEW_FLAGGED',
      reviewId,
      reason
    });
  }

  // ==================== SYSTEM-WIDE NOTIFICATIONS ====================

  /**
   * Send notification to all users (broadcast)
   * @param {string} message - The notification message
   * @param {object} metadata - Additional metadata (optional)
   */
  async broadcastToAllUsers(message, metadata = {}) {
    try {
      // Get all active users
      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id, role')
        .eq('status', 'ACTIVE');

      if (users && users.length > 0) {
        for (const user of users) {
          // Send to appropriate notification method based on role
          if (user.role === 'ELDERLY') {
            await this.sendNotification(user.user_id, message, metadata);
          } else if (user.role === 'CAREGIVER') {
            await this.sendCaregiverNotification(user.user_id, message, metadata);
          } else if (user.role === 'VOLUNTEER') {
            await this.sendVolunteerNotification(user.user_id, message, metadata);
          } else if (user.role === 'ADMIN') {
            await this.sendAdminNotification(user.user_id, message, metadata);
          }
        }
      }

      console.log(`Broadcast notification sent to all users: ${message}`);
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      // Don't throw error - notification failure shouldn't break main operation
    }
  }

  /**
   * SYSTEM 1: API/Service outage - When external services are down
   */
  async notifyServiceOutage(serviceName, description = 'temporarily unavailable due to service maintenance') {
    const message = `${serviceName} ${description}.`;
    await this.broadcastToAllUsers(message, {
      type: 'SYSTEM_SERVICE_OUTAGE',
      serviceName,
      description
    });
  }

  /**
   * SYSTEM 2: Feature updates - When new features are released
   */
  async notifyFeatureUpdate(featureName, description) {
    const message = `${featureName} ${description}!`;
    await this.broadcastToAllUsers(message, {
      type: 'SYSTEM_FEATURE_UPDATE',
      featureName,
      description
    });
  }

  /**
   * SYSTEM 3: Scheduled maintenance - Maintenance announcements
   */
  async notifyScheduledMaintenance(date, startTime, endTime) {
    const message = `CareRoute will undergo maintenance on ${date}, ${startTime}–${endTime}.`;
    await this.broadcastToAllUsers(message, {
      type: 'SYSTEM_SCHEDULED_MAINTENANCE',
      date,
      startTime,
      endTime
    });
  }
}

module.exports = new NotificationService();

