const { supabase, supabaseAdmin } = require('../config/supabase');

class RouteHistoryService {
  /**
   * Save a completed route to the database
   * @param {Object} routeData - The route data to save
   * @param {string} routeData.userId - The user ID who completed the route
   * @param {string} routeData.from - Starting location
   * @param {string} routeData.to - Destination location
   * @param {string} routeData.mode - Transportation mode
   * @param {string} routeData.duration - Route duration
   * @param {string} routeData.accessibility - Accessibility information
   * @param {Date} routeData.completedAt - When the route was completed
   * @param {number} routeData.steps - Number of steps in the route
   * @param {boolean} routeData.isRecommended - Whether this was a recommended route
   * @returns {Promise<Object>} The saved route data
   */
  static async saveRouteHistory(routeData) {
    try {
      // Build the insert data object
      const insertData = {
        user_id: routeData.userId,
        from_location: routeData.from,
        to_location: routeData.to,
        mode: routeData.mode,
        duration: routeData.duration,
        accessibility: routeData.accessibility,
        completed_at: routeData.completedAt,
        steps: routeData.steps,
        is_recommended: routeData.isRecommended,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Only include geolocation data if it exists and columns are available
      if (routeData.userLocation) {
        insertData.user_latitude = routeData.userLocation.latitude;
        insertData.user_longitude = routeData.userLocation.longitude;
        insertData.location_accuracy = routeData.userLocation.accuracy;
      }
      
      if (routeData.locationPermission) {
        insertData.location_permission = routeData.locationPermission;
      }

      const { data, error } = await supabaseAdmin
        .from('route_history')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error saving route history to Supabase:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveRouteHistory:', error);
      throw error;
    }
  }

  /**
   * Get route history for a specific user
   * @param {string} userId - The user ID
   * @param {number} limit - Maximum number of routes to return
   * @param {number} offset - Number of routes to skip
   * @returns {Promise<Array>} Array of route history records
   */
  static async getRouteHistory(userId, limit = 10, offset = 0) {
    try {
      const { data, error } = await supabaseAdmin
        .from('route_history')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching route history from Supabase:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRouteHistory:', error);
      throw error;
    }
  }

  /**
   * Get route statistics for a user
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Route statistics
   */
  static async getRouteStatistics(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('route_history')
        .select('mode, completed_at, is_recommended')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching route statistics from Supabase:', error);
        throw error;
      }

      const routes = data || [];
      const totalRoutes = routes.length;
      const recommendedRoutes = routes.filter(route => route.is_recommended).length;
      const modeCounts = routes.reduce((acc, route) => {
        acc[route.mode] = (acc[route.mode] || 0) + 1;
        return acc;
      }, {});

      // Get routes from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRoutes = routes.filter(route => 
        new Date(route.completed_at) >= thirtyDaysAgo
      ).length;

      return {
        totalRoutes,
        recommendedRoutes,
        recentRoutes,
        modeCounts,
        recommendationRate: totalRoutes > 0 ? (recommendedRoutes / totalRoutes) * 100 : 0
      };
    } catch (error) {
      console.error('Error in getRouteStatistics:', error);
      throw error;
    }
  }

  /**
   * Delete a route from history
   * @param {string} routeId - The route ID to delete
   * @param {string} userId - The user ID (for security)
   * @returns {Promise<boolean>} Success status
   */
  static async deleteRouteHistory(routeId, userId) {
    try {
      const { error } = await supabaseAdmin
        .from('route_history')
        .delete()
        .eq('id', routeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting route history from Supabase:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteRouteHistory:', error);
      throw error;
    }
  }
}

module.exports = RouteHistoryService;
