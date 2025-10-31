const CaregiverServices = require('../services/caregiver');
const Caregiver = require('../domain/caregiver');
const {supabase} = require('../config/supabase');
const Role = require('../domain/enum/Role');
const { getReceiverSocketId, io } = require('../middleware/socket');

class CaregiverController {
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

  static async linkByPIN(req, res) {
    try {
      const { pin } = req.body || {};
      if (!pin) return res.status(400).json({ error: 'PIN is required' });
      const link = await CaregiverServices.linkToElderlyByPIN(req.user.id, pin);
      res.status(201).json({ message: 'Linked', link });
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  static async getLinkedElderly(req, res) {
    try { res.json(await CaregiverServices.getLinkedElderly(req.user.id)); }
    catch (e) { res.status(500).json({ error: e.message }); }
  }

  static async submitReport(req, res) {
    try {
      const report = await CaregiverServices.submitReport(req.user.id, req.body || {});
      res.status(201).json(report);
    } catch (e) { res.status(400).json({ error: e.message }); }
  }

  static async requestHistory(req, res) {
    try {
      const { elderlyUserId } = req.params;
      const { limit, offset } = req.query;
      const requests = await CaregiverServices.getRequestHistory(
        req.user.id, elderlyUserId,
        { limit: Number(limit) || 20, offset: Number(offset) || 0 }
      );
      //console.log("Requesthistory data is:", requests)
      res.json(requests);
    } catch (e) {
      console.error(e);
      res.status(400).json({ error: e.message }); }
  }

  /**
   * Get current location for a linked elderly user
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
  /*static async getActiveTrips(req, res) {
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
  }*/
}

module.exports = CaregiverController;