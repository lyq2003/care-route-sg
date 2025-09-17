const express = require('express');
const profiles = require('./profiles');
const router = express.Router();
const authController = require('../auth/authController');
const { requireAuth } = require('../../middleware/auth');

router.post('/create',requireAuth,async(req,res) =>{
    try{
        const user_id = req.user.id;
        const newProfile=await profiles.createProfile(user_id);
        res.status(201).json({success:true,profile:newProfile});
    }catch(err){
        console.error('Error creating profile', err.message);
        res.status(500).json({success:false,error:'Failed to create profile'});
    }
})

router.put('/update',requireAuth,async(req,res) =>{
    try{
        const user_id = req.user.id;
        const { username,avatar_url }= req.body;

        if(!username){
            return res.status(400).json({
                success:false,
                error: 'Empty username'
            });
        }
        const newProfile=await profiles.updateProfile(user_id,username,avatar_url);
        res.status(201).json({success:true,profile:newProfile});
    }catch(err){
        console.error('Error updating profile', err.message);
        res.status(500).json({success:false,error:'Failed to update profile'});
    }
})

router.get('/getId', requireAuth,async(req,res) =>{
    try{
        const user_id=req.user.id;
        console.log("User_id is ", user_id)
        const profile= await profiles.getprofile(user_id);
        if (!profile) {
            return res.status(200).json({ 
                success: true, 
                profile: null  // Explicitly return null
            });
        }
        res.status(200).json({success:true, profile:profile});
    }catch(err){
        console.error('Error getting profile',err.message);
        res.status(500).json({success:false,error:'Failed to get user profile'});
    }
})

router.get('/getProfileUseName', requireAuth,async(req,res) =>{
    try{
        const {username}=req.query;
        const profile=await profiles.getProfileByname(username);
        if (!profile) {
            return res.status(200).json({ 
                success: true, 
                profile: null  // Explicitly return null
            });
        }
        res.status(200).json({success:true, profile:profile});
    }catch(err){
        console.error('Error getting profile',err.message);
        res.status(500).json({success:false,error:'Failed to get user profile'});
    }
})

router.get('/getotherUsers', requireAuth, async(req,res) =>{
    try{
        const user_id=req.user.id;
        const users=await profiles.getAllProfile();
        // Filter the users to exclude the logged-in user's profile
        const filteredUsers = users.filter(user => user._id.toString() !== user_id.toString());
        res.status(200).json({success:true,profiles:filteredUsers})
    }catch(err){
        console.error('Error getting users profile', err);
        res.status(500).json({success:false,error:'Failed to get users profile'});
    }
}) 
router.get('/',requireAuth,authController.profile);

module.exports=router;