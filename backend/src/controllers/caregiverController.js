const CaregiverServices = require('../services/caregiver');
const Caregiver = require('../domain/caregiver');
const {supabase} = require('../config/supabase');
const Role = require('../domain/enum/Role');
const { getReceiverSocketId, io } = require('../middleware/socket');

/**
 * Caregiver Controller
 * Handles HTTP requests for caregiver operations
 * Provides endpoints for linking to elderly users, viewing linked elderly, and monitoring their activities
 * All methods require caregiver authentication
 * 
 * @class CaregiverController
 * @example
 * // Used in routes: router.get('/me', CaregiverController.me);
 */
class CaregiverController {
  /**
   * Get caregiver profile with linked elderly users
   * @route GET /api/caregiver/me
   * @access Private (Caregiver only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Caregiver data with linked elderly list
   * @returns {Object} 500 - Server error
   */
  static async me(req, res) {
    try {
      // Get linked elderly data - using consistent naming with frontend
      const linkedElderly = await CaregiverServices.getLinkedElderly(req.user.id);
      
      res.json({ 
        linked_elderly: linkedElderly 
      });
    } catch (e) { 
      console.error('Error in caregiver/me:', e);
      res.status(500).json({ error: e.message }); 
    }
  }

  /**
   * Update caregiver profile
   * @route PUT /api/caregiver/profile
   * @access Private (Caregiver only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {Object} req.body - Profile updates
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Updated profile
   * @returns {Object} 400 - Validation errors
   */
  static async updateProfile(req, res) {
    try {
      // Pull current profile to validate merged data (optional but clean)
      const updates = req.body || {};
      const merged = { ...updates, role: 'CAREGIVER' };
      const { isValid, errors } = Caregiver.validate(merged);
      if (!isValid) return res.status(400).json({ errors });

      const updated = await CaregiverServices.updateProfile(req.user.id, updates);
      res.json({ message: 'Profile updated', profile: updated });
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  /**
   * Update linked elderly user's profile
   * @route PUT /api/caregiver/elderly/:elderlyUserId/profile
   * @access Private (Caregiver only, must be linked to elderly)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {string} req.params.elderlyUserId - Elderly user ID to update
   * @param {Object} req.body - Profile updates
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Elderly profile updated
   * @returns {Object} 403 - Not authorized (not linked to this elderly)
   * @returns {Object} 400 - Validation errors
   */
  static async updateElderlyProfile(req, res) {
    try {
      const { elderlyUserId } = req.params;
      const updates = req.body || {};
      
      // Verify the elderly user is linked to this caregiver
      const linkedElderly = await CaregiverServices.getLinkedElderly(req.user.id);
      const isLinked = linkedElderly.some(elderly => elderly.user_id === elderlyUserId);
      
      if (!isLinked) {
        return res.status(403).json({ error: 'Not authorized to update this elderly user profile' });
      }
      
      const updated = await CaregiverServices.updateElderlyProfile(elderlyUserId, updates);
      res.json({ message: 'Elderly profile updated', profile: updated });
    } catch (e) { 
      console.error('Error updating elderly profile:', e);
      res.status(400).json({ error: e.message }); 
    }
  }

  /**
   * Link caregiver to elderly user using PIN
   * @route POST /api/caregiver/link
   * @access Private (Caregiver only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {Object} req.body - Link data
   * @param {string} req.body.pin - 6-digit linking PIN from elderly user
   * @param {Response} res - Express response object
   * @returns {Object} 201 - Successfully linked
   * @returns {Object} 400 - Invalid PIN or missing PIN
   */
  static async linkByPIN(req, res) {
    try {
      const { pin } = req.body || {};
      if (!pin) return res.status(400).json({ error: 'PIN is required' });
      const link = await CaregiverServices.linkToElderlyByPIN(req.user.id, pin);
      res.status(201).json({ message: 'Linked', link });
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  /**
   * Get all linked elderly users
   * @route GET /api/caregiver/elderly
   * @access Private (Caregiver only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of linked elderly profiles
   * @returns {Object} 500 - Server error
   */
  static async getLinkedElderly(req, res) {
    try { res.json(await CaregiverServices.getLinkedElderly(req.user.id)); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }

  /**
   * Submit a report on behalf of linked elderly user
   * @route POST /api/caregiver/report
   * @access Private (Caregiver only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {Object} req.body - Report data
   * @param {string} req.body.linkedElderlyUserId - Linked elderly user ID
   * @param {string} req.body.reportedVolunteerUserId - Volunteer user ID being reported
   * @param {Array} req.body.reasons - Array of report reasons
   * @param {string} [req.body.description] - Optional detailed description
   * @param {Response} res - Express response object
   * @returns {Object} 201 - Report created successfully
   * @returns {Object} 400 - Not linked to this elderly or missing required fields
   * @returns {Object} 500 - Server error
   */
  static async submitReport(req, res) {
    try {
      const report = await CaregiverServices.submitReport(req.user.id, req.body || {});
      res.status(201).json(report);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  /**
   * Get help request history for a linked elderly user
   * @route GET /api/caregiver/elderly/:elderlyUserId/requests
   * @access Private (Caregiver only, must be linked to elderly)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {string} req.params.elderlyUserId - Elderly user ID
   * @param {Object} req.query - Query parameters
   * @param {number} [req.query.limit=20] - Maximum results to return
   * @param {number} [req.query.offset=0] - Number of results to skip
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Array of help requests
   * @returns {Object} 400 - Not linked to this elderly
   * @returns {Object} 500 - Server error
   */
  static async requestHistory(req, res) {
    try {
      const { elderlyUserId } = req.params;
      const { limit, offset } = req.query;
      const data = await CaregiverServices.getRequestHistory(
        req.user.id, elderlyUserId,
        { limit: Number(limit) || 20, offset: Number(offset) || 0 }
      );
      res.json(data);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  /**
   * Get current location for a linked elderly user
   * @route GET /api/caregiver/elderly/:elderlyUserId/location
   * @access Private (Caregiver only)
   * @param {Request} req - Express request object
   * @param {string} req.user.id - Caregiver user ID (from authentication)
   * @param {string} req.params.elderlyUserId - ID of elderly user
   * @param {Response} res - Express response object
   * @returns {Object} 200 - Current location data
   * @returns {Object} 403 - Not authorized (not linked to this elderly)
   * @returns {Object} 404 - Location not found
   */
  static async getElderlyLocation(req, res) {
    try {
      const { elderlyUserId } = req.params;

      // Verify caregiver is linked to this elderly user
      const linkedElderly = await CaregiverServices.getLinkedElderly(req.user.id);
      const isLinked = linkedElderly.some(elderly => elderly.user_id === elderlyUserId);
      
      if (!isLinked) {
        return res.status(403).json({ error: 'Not authorized to view this elderly user\'s location' });
      }

      // Get current location
      const { data: location, error } = await supabase
        .from('elderly_locations')
        .select('*')
        .eq('elderly_id', elderlyUserId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !location) {
        return res.status(404).json({ error: 'No location data available for this user' });
      }

      // Get elderly user details
      const { data: elderlyProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('full_name, username')
        .eq('user_id', elderlyUserId)
        .single();

      const elderlyName = elderlyProfile?.full_name || elderlyProfile?.username || 'Unknown';

      res.json({
        success: true,
        data: {
          elderlyId: elderlyUserId,
          elderlyName,
          location: {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
            timestamp: location.timestamp
          },
          tripContext: {
            tripId: location.trip_id,
            helpRequestId: location.help_request_id,
            status: location.status
          },
          metadata: location.metadata
        }
      });

    } catch (err) {
      console.error('Get elderly location error:', err);
      res.status(500).json({ error: err.message || 'Failed to get elderly location' });
    }
  }

  /**
   * Get location history for a linked elderly user
   */
  static async getElderlyLocationHistory(req, res) {
    try {
      const { elderlyUserId } = req.params;
      const { limit = 50, hours = 24 } = req.query;

      // Verify caregiver is linked to this elderly user
      const linkedElderly = await CaregiverServices.getLinkedElderly(req.user.id);
      const isLinked = linkedElderly.some(elderly => elderly.user_id === elderlyUserId);
      
      if (!isLinked) {
        return res.status(403).json({ error: 'Not authorized to view this elderly user\'s location history' });
      }

      // Get location history
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data: locations, error } = await supabase
        .from('elderly_locations')
        .select('*')
        .eq('elderly_id', elderlyUserId)
        .gte('timestamp', hoursAgo)
        .order('timestamp', { ascending: false })
        .limit(Number(limit));

      if (error) {
        console.error('Error fetching location history:', error);
        return res.status(500).json({ error: 'Failed to fetch location history' });
      }

      res.json({
        success: true,
        data: (locations || []).map(loc => ({
          location: {
            lat: loc.latitude,
            lng: loc.longitude,
            accuracy: loc.accuracy,
            timestamp: loc.timestamp
          },
          tripContext: {
            tripId: loc.trip_id,
            helpRequestId: loc.help_request_id,
            status: loc.status
          },
          metadata: loc.metadata
        }))
      });

    } catch (err) {
      console.error('Get elderly location history error:', err);
      res.status(500).json({ error: err.message || 'Failed to get location history' });
    }
  }

  /**
   * Get active trips for linked elderly users
   */
  static async getActiveTrips(req, res) {
    try {
      const linkedElderly = await CaregiverServices.getLinkedElderly(req.user.id);
      const elderlyIds = linkedElderly.map(elderly => elderly.user_id);

      if (elderlyIds.length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Get active trips for all linked elderly users
      const { data: trips, error } = await supabase
        .from('elderly_trips')
        .select(`
          *,
          elderly:user_profiles!elderly_id (
            user_id,
            full_name,
            username
          )
        `)
        .in('elderly_id', elderlyIds)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching active trips:', error);
        return res.status(500).json({ error: 'Failed to fetch active trips' });
      }

      const formattedTrips = (trips || []).map(trip => ({
        tripId: trip.id,
        elderlyId: trip.elderly_id,
        elderlyName: trip.elderly?.full_name || trip.elderly?.username || 'Unknown',
        origin: trip.origin,
        destination: trip.destination,
        tripType: trip.trip_type,
        status: trip.status,
        startedAt: trip.started_at,
        helpRequestId: trip.help_request_id,
        volunteerId: trip.volunteer_id
      }));

      res.json({ success: true, data: formattedTrips });

    } catch (err) {
      console.error('Get active trips error:', err);
      res.status(500).json({ error: err.message || 'Failed to get active trips' });
    }
  }
}

module.exports = CaregiverController;