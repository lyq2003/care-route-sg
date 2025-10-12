const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const router= express.Router();

async function getPendingRequests(latitude,longitude,limit,offset){
    const { data, error } = await supabaseAdmin.rpc('get_pending_requests_nearby', {
        lat: latitude,
        lon: longitude,
        radius_meters: 2000,
        limit_count: limit,
        offset_count: offset
    });
    if(error) throw error;
    return data;
}

// edit the filters.distance after mallvin change table 

async function getFilteredRequests(filters){
    let query = supabaseAdmin.from('help_request').select('*, user_profiles(username)').eq('helpRequestStatus', 1);

    for (const key in filters){
        const value = filters[key];

        if (value === undefined || value === null || value === '' || (Array.isArray(value) && (value.length === 0 || (value.length === 1 && value[0] === '')))){
            continue;
        }

        // Skip the "urgency" filter if the value is "all"
        if (key === 'urgency' && value === 'all') {
            continue;
        }

        // Skip distance for now
        if(key === 'distance'){
            continue;
        }

        if(Array.isArray(value)){
            query=query.in(key,value);
        }
        else{
            query=query.eq(key,value);
        }
    }

    const {data,error} =await query.order('createdAt', { ascending: false });
    if(error) throw error;
    return data;    

}
module.exports = {
    getPendingRequests,
    getFilteredRequests,
}
