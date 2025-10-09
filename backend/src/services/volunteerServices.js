const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const router= express.Router();

async function getPendingRequests(latitude,longitude){
    const { data, error } = await supabaseAdmin
    .from('help_request')
    .select('*, user_profiles(username)')
    .eq('helpRequestStatus', 1)

    if(error) throw error;
    return data;
}

module.exports = {
    getPendingRequests,
}
