# Route History Integration with Supabase

This document describes the route history functionality that has been integrated with Supabase.

## Overview

The route history feature allows elderly users to:
- Save completed routes to their personal history
- View their route history with details like mode, duration, and accessibility
- Delete routes from their history
- Get statistics about their route usage

## Database Schema

### Table: `route_history`

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PRIMARY KEY | Unique identifier |
| user_id | UUID | References auth.users(id) |
| from_location | TEXT | Starting location |
| to_location | TEXT | Destination location |
| mode | TEXT | Transportation mode (MRT, Bus, Walk, etc.) |
| duration | TEXT | Route duration |
| accessibility | TEXT | Accessibility information |
| completed_at | TIMESTAMP | When the route was completed |
| steps | INTEGER | Number of steps in the route |
| is_recommended | BOOLEAN | Whether this was a recommended route |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

## API Endpoints

### POST `/api/elderly/route-history`
Save a completed route to the user's history.

**Request Body:**
```json
{
  "from": "Marina Bay Sands",
  "to": "Changi Airport",
  "mode": "MRT + Bus",
  "duration": "45 mins",
  "accessibility": "Wheelchair accessible",
  "completedAt": "2024-01-15T10:30:00Z",
  "steps": 8,
  "isRecommended": true
}
```

**Response:**
```json
{
  "message": "Route history saved successfully",
  "routeHistory": {
    "id": 1,
    "user_id": "uuid",
    "from_location": "Marina Bay Sands",
    "to_location": "Changi Airport",
    // ... other fields
  }
}
```

### GET `/api/elderly/route-history`
Retrieve the user's route history.

**Query Parameters:**
- `limit` (optional): Number of routes to return (default: 10)
- `offset` (optional): Number of routes to skip (default: 0)

**Response:**
```json
{
  "message": "Route history retrieved successfully",
  "history": [
    {
      "id": 1,
      "from": "Marina Bay Sands",
      "to": "Changi Airport",
      "mode": "MRT + Bus",
      "duration": "45 mins",
      "accessibility": "Wheelchair accessible",
      "completedAt": "2024-01-15T10:30:00Z",
      "steps": 8,
      "isRecommended": true
    }
  ]
}
```

### DELETE `/api/elderly/route-history/:routeId`
Delete a specific route from the user's history.

**Response:**
```json
{
  "message": "Route deleted successfully"
}
```

### GET `/api/elderly/route-history/stats`
Get statistics about the user's route usage.

**Response:**
```json
{
  "message": "Route statistics retrieved successfully",
  "statistics": {
    "totalRoutes": 25,
    "recommendedRoutes": 18,
    "recentRoutes": 5,
    "modeCounts": {
      "MRT": 10,
      "Bus": 8,
      "Walk": 7
    },
    "recommendationRate": 72.0
  }
}
```

## Security

- Row Level Security (RLS) is enabled
- Users can only access their own route history
- All operations require authentication

## Frontend Integration

The frontend has been updated to:
- Automatically save routes when completed
- Display route history in the elderly dashboard
- Allow users to delete routes from their history
- Show route statistics and recommendations

## Setup Instructions

1. Run the migration script in your Supabase database:
   ```sql
   -- Execute the contents of backend/migrations/create_route_history_table.sql
   ```

2. Ensure your environment variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

3. The backend service will automatically handle route saving when routes are completed in the frontend.

## Error Handling

All endpoints include proper error handling and will return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (missing required fields)
- 401: Unauthorized (not authenticated)
- 404: Not Found (route not found for deletion)
- 500: Internal Server Error

Error responses include a `details` field with more specific error information for debugging.
