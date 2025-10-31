const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const router = express.Router();

async function getAllProfile() {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')

    if (error) throw error;
    return data;
}
async function createProfile(user_id) {
    const { data, error } = await supabase
        .from('user_profiles')
        .insert([{ user_id }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function updateProfile(user_id, username, avatar_url) {
    const { data, error } = await supabase
        .from('user_profiles')
        .update({ user_id, username, avatar_url })
        .eq('user_id', user_id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function getprofile(user_id) {
    /* const {data,error} = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id',user_id)
    .maybeSingle(); */

    // Added by Mallvin on 31/10/2025 to get user accessibility needs as well
    const { data, error } = await supabase
    .from('user_profiles')
    .select('*, user_accessibility_needs(*)')
    .eq('user_id', user_id)
    
    if (error) throw error;
    return data;
}

async function getProfileByname(username) {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

    if (error) throw error;
    return data;
}

async function updateRole(user_id, role) {
    console.log("The user_id and role is:", user_id, role);
    const { data, error } = await supabaseAdmin.auth.admin
        .updateUserById(user_id, {
            user_metadata: {
                role: role,
            },
        });

    const { data1, error1 } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('user_id', user_id)
        .select()
        .single();

    if (error) throw error;
    if (error1) throw error1;
    return data1;
}

module.exports = {
    createProfile,
    updateProfile,
    getprofile,
    getAllProfile,
    getProfileByname,
    updateRole
}