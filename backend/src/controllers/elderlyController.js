const Elderly = require('../domain/elderly');
const UserService = require('../services/user');
const ElderlyServices = require('../services/elderly');
const NotificationService = require('../services/notificationService');
const { supabase } = require('../config/supabase');
const { getReceiverSocketId, io } = require('../middleware/socket');

/**
 * Elderly Controller
 * Handles HTTP requests for elderly user operations
 * Provides endpoints for profile management, linking PINs, location tracking, and caregiver management
 * All methods require elderly user authentication
 * 
 * @class ElderlyController
 * @example
 * // Used in routes: router.get('/profile', ElderlyController.getProfile);
 */
class ElderlyController {
  /**
   * Get elderly user profile
   * @route GET /api/elderly/profile
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - User profile data
   * @returns {Object} 404 - User not found
   * @returns {Object} 500 - Server error
   */
  static async getProfile(req, res) {
    try {
      const elderly = await UserService.findById(req.user.id);
      if (!elderly) return res.status(404).json({ error: 'Not found' });
      res.json(elderly);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update elderly user profile
   * @route PUT /api/elderly/profile
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Object} req.body - Profile updates
   * @param {string} [req.body.mobilityPreference] - Mobility preference setting
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Updated profile data
   * @returns {Object} 500 - Server error
   */
  static async updateProfile(req, res) {
    try {
      const { mobilityPreference } = req.body;
      const updated = await UserService.update(req.user.id, { mobilityPreference });
      res.json({ message: 'Profile updated', updated });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update language preference for elderly user
   * @route PUT /api/elderly/language
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Object} req.body - Language preference data
   * @param {string} req.body.language - Language code (en, zh, ms, ta)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Success message with updated language
   * @returns {Object} 400 - Invalid language code or missing language
   * @returns {Object} 500 - Server error
   */
  static async updateLanguagePreference(req, res) {
    try {
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ error: 'Language is required' });
      }

      // Validate language code
      const validLanguages = ['en', 'zh', 'ms', 'ta'];
      if (!validLanguages.includes(language)) {
        return res.status(400).json({ error: 'Invalid language code' });
      }

      // Update language preference in user profile
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          language_preference: language
        })
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating language preference:', error);
        return res.status(500).json({ error: 'Failed to update language preference' });
      }

      res.json({ 
        message: 'Language preference updated successfully', 
        language: language,
        profile: data
      });
    } catch (err) {
      console.error('Update language preference error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get linking PIN for elderly user (generates one if it doesn't exist)
   * @route GET /api/elderly/linking-pin
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Linking PIN and instructions
   * @returns {Object} 500 - Server error
   */
  static async getLinkingPIN(req, res) {
    try {
      const pin = await ElderlyServices.getLinkingPIN(req.user.id);
      res.json({ 
        message: 'Linking PIN retrieved successfully', 
        pin,
        instructions: 'Share this 6-digit PIN with your caregiver to link your accounts.'
      });
    } catch (err) {
      console.error('Get linking PIN error:', err);
      res.status(500).json({ error: err.message || 'Failed to get linking PIN' });
    }
  }

  /**
   * Regenerate linking PIN for elderly user
   * @route POST /api/elderly/linking-pin/regenerate
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - New linking PIN and instructions
   * @returns {Object} 500 - Server error
   */
  static async regenerateLinkingPIN(req, res) {
    try {
      const pin = await ElderlyServices.regenerateLinkingPIN(req.user.id);
      res.json({ 
        message: 'New linking PIN generated successfully', 
        pin,
        instructions: 'Your old PIN is no longer valid. Share this new 6-digit PIN with your caregiver.'
      });
    } catch (err) {
      console.error('Regenerate linking PIN error:', err);
      res.status(500).json({ error: err.message || 'Failed to regenerate linking PIN' });
    }
  }

  /**
   * Get all caregivers linked to this elderly user
   * @route GET /api/elderly/caregivers
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of linked caregiver profiles
   * @returns {Object} 500 - Server error
   */
  static async getLinkedCaregivers(req, res) {
    try {
      const caregivers = await ElderlyServices.getLinkedCaregivers(req.user.id);
      res.json({ caregivers });
    } catch (err) {
      console.error('Get linked caregivers error:', err);
      res.status(500).json({ error: err.message || 'Failed to get linked caregivers' });
    }
  }

  /**
   * Update elderly user's real-time location
   * Stores location in database and broadcasts to linked caregivers via WebSocket
   * @route POST /api/elderly/location
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Object} req.body - Location data
   * @param {number} req.body.latitude - Latitude coordinate (required)
   * @param {number} req.body.longitude - Longitude coordinate (required)
   * @param {number} [req.body.accuracy] - Location accuracy in meters
   * @param {number} [req.body.speed] - Speed in m/s
   * @param {number} [req.body.heading] - Heading in degrees
   * @param {number} [req.body.altitude] - Altitude in meters
   * @param {string} [req.body.tripId] - Related trip ID
   * @param {string} [req.body.helpRequestId] - Related help request ID
   * @param {string} [req.body.status] - Location status (active, idle, etc.)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Location stored successfully
   * @returns {Object} 400 - Missing required location data
   * @returns {Object} 500 - Server error
   */
  static async updateLocation(req, res) {
    try {
      const { latitude, longitude, accuracy, speed, heading, altitude, tripId, helpRequestId, status } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required' });
      }

      const locationData = {
        elderly_id: req.user.id,
        latitude,
        longitude,
        accuracy: accuracy || null,
        timestamp: new Date().toISOString(),
        trip_id: tripId || null,
        help_request_id: helpRequestId || null,
        status: status || 'active',
        metadata: {
          speed: speed || null,
          heading: heading || null,
          altitude: altitude || null
        }
      };

      // Store location in database
      const { data: locationRecord, error } = await supabase
        .from('elderly_locations')
        .upsert(locationData, { 
          onConflict: 'elderly_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing location:', error);
        return res.status(500).json({ error: 'Failed to store location' });
      }

      // Get linked caregivers
      const linkedCaregivers = await ElderlyController.getLinkedCaregiversForNotification(req.user.id);

      // Broadcast location to caregivers via WebSocket
      await ElderlyController.broadcastLocationToCaregivers(req.user.id, locationData, linkedCaregivers);

      // Check for location alerts
      await ElderlyController.checkLocationAlerts(req.user.id, { lat: latitude, lng: longitude, accuracy }, linkedCaregivers);

      res.json({ success: true, data: locationRecord });

    } catch (err) {
      console.error('Update location error:', err);
      res.status(500).json({ error: err.message || 'Failed to update location' });
    }
  }

  /**
   * Start trip tracking for elderly user
   * @route POST /api/elderly/trips/start
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {Object} req.body - Trip data
   * @param {string} req.body.origin - Trip origin location
   * @param {string} req.body.destination - Trip destination location
   * @param {string} [req.body.type] - Trip type (default: 'route')
   * @param {string} [req.body.helpRequestId] - Related help request ID
   * @param {string} [req.body.volunteerId] - Assigned volunteer ID
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Trip started successfully
   * @returns {Object} 400 - Missing origin or destination
   * @returns {Object} 500 - Server error
   */
  static async startTripTracking(req, res) {
    try {
      const { origin, destination, type, helpRequestId, volunteerId } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' });
      }

      // Create trip record
      const { data: trip, error } = await supabase
        .from('elderly_trips')
        .insert({
          elderly_id: req.user.id,
          origin,
          destination,
          trip_type: type || 'route',
          help_request_id: helpRequestId || null,
          volunteer_id: volunteerId || null,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating trip record:', error);
        return res.status(500).json({ error: 'Failed to create trip record' });
      }

      // Notify linked caregivers about trip start
      const linkedCaregivers = await ElderlyController.getLinkedCaregiversForNotification(req.user.id);
      const elderlyName = await ElderlyController.getElderlyName(req.user.id);

      for (const caregiver of linkedCaregivers) {
        await NotificationService.sendCaregiverNotification(
          caregiver.user_id,
          `${elderlyName} has started a trip from ${origin} to ${destination}`,
          {
            type: 'TRIP_STARTED',
            elderlyId: req.user.id,
            elderlyName,
            tripId: trip.id,
            origin,
            destination,
            volunteerId
          }
        );
      }

      res.json({ success: true, data: trip });

    } catch (err) {
      console.error('Start trip tracking error:', err);
      res.status(500).json({ error: err.message || 'Failed to start trip tracking' });
    }
  }

  /**
   * Complete trip tracking for elderly user
   * @route POST /api/elderly/trips/:tripId/complete
   * @access Private (Elderly only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Elderly user ID (from authentication)
   * @param {string} req.params.tripId - Trip ID to complete
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Trip completed successfully
   * @returns {Object} 400 - Missing trip ID
   * @returns {Object} 500 - Server error
   */
  static async completeTripTracking(req, res) {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({ error: 'Trip ID is required' });
      }

      // Update trip status
      const { data: trip, error } = await supabase
        .from('elderly_trips')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .eq('elderly_id', req.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error completing trip:', error);
        return res.status(500).json({ error: 'Failed to complete trip' });
      }

      // Update location status to completed
      await supabase
        .from('elderly_locations')
        .update({ status: 'completed' })
        .eq('elderly_id', req.user.id)
        .eq('trip_id', tripId);

      // Notify caregivers of trip completion
      const linkedCaregivers = await ElderlyController.getLinkedCaregiversForNotification(req.user.id);
      const elderlyName = await ElderlyController.getElderlyName(req.user.id);

      for (const caregiver of linkedCaregivers) {
        await NotificationService.sendCaregiverNotification(
          caregiver.user_id,
          `${elderlyName} has safely completed their trip`,
          {
            type: 'TRIP_COMPLETED',
            elderlyId: req.user.id,
            elderlyName,
            tripId: trip.id
          }
        );
      }

      res.json({ success: true, data: trip });

    } catch (err) {
      console.error('Complete trip tracking error:', err);
      res.status(500).json({ error: err.message || 'Failed to complete trip tracking' });
    }
  }

  /**
   * Helper: Get linked caregivers for notifications
   * @param {string} elderlyId - Elderly user ID
   * @returns {Promise<Array>} Array of caregiver objects
   * @private
   */
  static async getLinkedCaregiversForNotification(elderlyId) {
    try {
      const { data: caregivers, error } = await supabase
        .from('caregiver_link')
        .select(`
          caregiver_user_id,
          caregiver:user_profiles!caregiver_user_id (
            user_id,
            full_name,
            email,
            phone
          )
        `)
        .eq('elderly_user_id', elderlyId);

      if (error) {
        console.error('Error fetching linked caregivers:', error);
        return [];
      }

      return (caregivers || []).map(link => link.caregiver).filter(c => c);
    } catch (error) {
      console.error('Error getting linked caregivers:', error);
      return [];
    }
  }

  /**
   * Helper: Get elderly user's name
   * @param {string} elderlyId - Elderly user ID
   * @returns {Promise<string>} Elderly user's full name or username
   * @private
   */
  static async getElderlyName(elderlyId) {
    try {
      const { data: elderly, error } = await supabase
        .from('user_profiles')
        .select('full_name, username')
        .eq('user_id', elderlyId)
        .single();

      return elderly?.full_name || elderly?.username || 'Unknown';
    } catch (error) {
      console.error('Error getting elderly name:', error);
      return 'Unknown';
    }
  }

  /**
   * Helper: Broadcast location update to linked caregivers via WebSocket
   * @param {string} elderlyId - Elderly user ID
   * @param {Object} locationData - Location data object
   * @param {number} locationData.latitude - Latitude coordinate
   * @param {number} locationData.longitude - Longitude coordinate
   * @param {number} [locationData.accuracy] - Location accuracy in meters
   * @param {string} [locationData.timestamp] - Location timestamp
   * @param {string} [locationData.trip_id] - Related trip ID
   * @param {Array} linkedCaregivers - Array of linked caregiver objects
   * @returns {Promise<void>}
   * @private
   */
  static async broadcastLocationToCaregivers(elderlyId, locationData, linkedCaregivers) {
    try {
      const elderlyName = await ElderlyController.getElderlyName(elderlyId);
      const locationString = `Lat: ${locationData.latitude.toFixed(4)}, Lng: ${locationData.longitude.toFixed(4)}`;

      // Get trip context if this location is part of a trip
      let tripContext = null;
      if (locationData.trip_id) {
        const { data: trip, error } = await supabase
          .from('elderly_trips')
          .select('id, origin, destination, trip_type, status, help_request_id, volunteer_id')
          .eq('id', locationData.trip_id)
          .single();
        
        if (!error && trip) {
          tripContext = {
            tripId: trip.id,
            helpRequestId: trip.help_request_id,
            status: trip.status,
            origin: trip.origin,
            destination: trip.destination,
            tripType: trip.trip_type
          };
        }
      }

      for (const caregiver of linkedCaregivers) {
        // Send real-time WebSocket update
        const caregiverSocketId = getReceiverSocketId(caregiver.user_id);
        if (caregiverSocketId) {
          io.to(caregiverSocketId).emit('elderly_location_update', {
            elderlyId,
            elderlyName,
            location: {
              lat: locationData.latitude,
              lng: locationData.longitude,
              accuracy: locationData.accuracy,
              timestamp: locationData.timestamp
            },
            tripContext: tripContext
          });
        }

        // Send structured notification using existing notification service
        await NotificationService.notifyCaregiverProgressUpdate(
          caregiver.user_id,
          elderlyName,
          locationString,
          null // No estimated arrival for now
        );

        console.log(`Location broadcast to caregiver ${caregiver.user_id} for elderly ${elderlyId}`);
      }
    } catch (error) {
      console.error('Error broadcasting location to caregivers:', error);
    }
  }

  /**
   * Helper: Check for location-based alerts and notify caregivers
   * @param {string} elderlyId - Elderly user ID
   * @param {Object} location - Location object with lat, lng, accuracy
   * @param {Array} linkedCaregivers - Array of linked caregiver objects
   * @returns {Promise<void>}
   * @private
   */
  static async checkLocationAlerts(elderlyId, location, linkedCaregivers) {
    try {
      // Check if elderly has moved significantly from last known safe location
      const lastSafeLocation = await ElderlyController.getLastSafeLocation(elderlyId);
      
      if (lastSafeLocation) {
        const distance = ElderlyController.calculateDistance(location, lastSafeLocation);
        
        // Alert if moved more than 5km from last safe location
        if (distance > 5000) {
          await ElderlyController.sendLocationAlert(
            elderlyId, 
            linkedCaregivers, 
            'DISTANCE_ALERT',
            `Elderly user has moved ${Math.round(distance/1000)}km from their usual area`
          );
        }
      }

      // Check for low accuracy (possible indoor/emergency situation)
      if (location.accuracy && location.accuracy > 100) {
        await ElderlyController.sendLocationAlert(
          elderlyId,
          linkedCaregivers,
          'ACCURACY_ALERT', 
          'GPS signal is weak - elderly may be indoors or in a challenging location'
        );
      }

    } catch (error) {
      console.error('Error checking location alerts:', error);
    }
  }

  /**
   * Helper: Get last known safe (completed) location
   * @param {string} elderlyId - Elderly user ID
   * @returns {Promise<Object|null>} Location object with lat/lng or null
   * @private
   */
  static async getLastSafeLocation(elderlyId) {
    try {
      const { data: location, error } = await supabase
        .from('elderly_locations')
        .select('latitude, longitude')
        .eq('elderly_id', elderlyId)
        .eq('status', 'completed')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !location) return null;

      return {
        lat: location.latitude,
        lng: location.longitude
      };
    } catch (error) {
      console.error('Error getting last safe location:', error);
      return null;
    }
  }

  /**
   * Helper: Calculate distance between two GPS points using Haversine formula
   * @param {Object} point1 - First point with lat and lng properties
   * @param {Object} point2 - Second point with lat and lng properties
   * @returns {number} Distance in meters
   * @private
   */
  static calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI/180;
    const φ2 = point2.lat * Math.PI/180;
    const Δφ = (point2.lat-point1.lat) * Math.PI/180;
    const Δλ = (point2.lng-point1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Helper: Send location alert notification to caregivers
   * @param {string} elderlyId - Elderly user ID
   * @param {Array} linkedCaregivers - Array of linked caregiver objects
   * @param {string} alertType - Type of alert (e.g., 'DISTANCE_ALERT', 'ACCURACY_ALERT')
   * @param {string} message - Alert message
   * @returns {Promise<void>}
   * @private
   */
  static async sendLocationAlert(elderlyId, linkedCaregivers, alertType, message) {
    try {
      const elderlyName = await ElderlyController.getElderlyName(elderlyId);
      const fullMessage = `Location Alert for ${elderlyName}: ${message}`;

      for (const caregiver of linkedCaregivers) {
        await NotificationService.sendCaregiverNotification(
          caregiver.user_id,
          fullMessage,
          {
            type: alertType,
            elderlyId,
            elderlyName,
            priority: 'high'
          }
        );
      }
    } catch (error) {
      console.error('Error sending location alert:', error);
    }
  }
}

module.exports = ElderlyController;
