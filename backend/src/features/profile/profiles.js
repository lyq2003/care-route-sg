const express = require('express');
const { supabase } = require('../../config/supabase');
const router= express.Router();

async function getAllProfile(){
    const{data,error}= await supabase
    .from('user_profiles')
    .select('*')

    if(error) throw error;
    return data;
}
async function createProfile(user_id){
    const {data,error} = await supabase
    .from('user_profiles')
    .insert([{user_id}])
    .select()
    .single();

    if(error) throw error;
    return data;
}

async function updateProfile(user_id,username,avatar_url){
    const {data,error} = await supabase
    .from('user_profiles')
    .update({user_id,username,avatar_url})
    .eq('user_id',user_id)
    .select()
    .single();

    if(error) throw error;
    return data;
}

async function getprofile(user_id){
    const {data,error} = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id',user_id)
    .maybeSingle();

    if(error) throw error;
    return data;   
}

async function getProfileByname(username){
    const {data,error}=await supabase
    .from('user_profiles')
    .select('*')
    .eq('username',username)
    .maybeSingle();

    if(error) throw error;
    return data;
}
module.exports={
    createProfile,
    updateProfile,
    getprofile,
    getAllProfile,
    getProfileByname
}