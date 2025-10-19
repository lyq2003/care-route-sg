const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const router= express.Router();

async function getPendingRequests(latitude,longitude,limit,offset){
    const { data, error } = await supabaseAdmin.rpc('get_pending_requests_nearby', {
        lat: latitude,
        lon: longitude,
        radius_meters: 10000,
        limit_count: limit,
        offset_count: offset
    });
    if(error) throw error;
    return data;
}

// edit the filters.distance after mallvin change table 

async function getFilteredRequests(latitude,longitude,filters,limit,offset){
    //console.log("filters json are: ",filters, "latitude:", latitude, "longitude:",longitude);
    const { data, error } = await supabaseAdmin.rpc("get_pending_requests_nearby", {
        lat: latitude,
        lon: longitude,
        radius_meters: filters.distance,
        limit_count: limit,
        offset_count: offset,
    });
    
    if(error) throw error;
    let filteredData = data;

    // Apply urgency filter (if not 'all')
    if (filters.urgency && filters.urgency !== "all") {
        filteredData = filteredData.filter((item) => item.urgency === filters.urgency);
    }

    return filteredData;    
}

async function acceptRequest(postId,volunteerId){
    const {data,error}= await supabaseAdmin
    .from("help_request")
    .update({assignedVolunteerId: volunteerId, helpRequestStatus: "2" })
    .eq('id',postId)
    .select()
    .single();

    if(error) throw error;
    return data;
}

async function cancelRequest(postId,volunteerId){
    const {data,error}= await supabaseAdmin
    .from("help_request")
    .update({assignedVolunteerId: null, helpRequestStatus: "1" })
    .eq('id',postId)
    .select()
    .single();

    if(error) throw error;
    return data;
}

async function getAcceptedRequest(volunteerId){
    const {data,error} = await supabaseAdmin
    .from("help_request")
    .select('*')
    .eq("assignedVolunteerId", volunteerId)
    .eq("helpRequestStatus", "2")
    .select()
    .single()
    
    if(error) throw error;
    return data;
}


module.exports = {
    getPendingRequests,
    getFilteredRequests,
    acceptRequest,
    getAcceptedRequest,
    cancelRequest,
}
