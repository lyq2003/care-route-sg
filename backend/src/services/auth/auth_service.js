const profiles = require('../profiles');
const { supabase }=require('../../config/supabase');
const NotificationService = require('../notificationService');
const Role = require('../../domain/enum/Role');
const UserAccessibilityNeedsService = require("../userAccessibilityNeeds");

// Login
exports.login = async (req,res)=>{
    try {
        const { email, password } = req.body

        if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
        }

        const {data,error} = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Signin error:", error);
            return res.status(401).json({ message: error.message });
        }

        // getting user profile to update to session
        const user = data.user;
        let profile = null;
        const{ data:profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();
        
        if (profileError) console.warn("Profile not found:", profileError);
        else profile = profileData;

        
        // Set session data
        req.session.user ={ 
            ...user,
            username:profile?.username||null,
            role:profile?.role||null,
            online: true,
        };


        // Save session and update DB
        req.session.save(async (err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ message: "Failed to create session" });
            }

            // Update online status in DB
            const { error: updateError } = await supabase
                .from("user_profiles")
                .update({ online: true })
                .eq("user_id", user.id);

            if (updateError) {
                console.error("Error updating user online status:", updateError);
            }

            // After successful login 
            return res.status(200).json({
                message: "Login successful",
                user: data.user,
                session: data.session,
                redirectUrl: `/auth/success?newUser=false&role=${profile?.role}`
            });
        });
    } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.signup = async (req,res) => {
    try {
        const {name, email, password, role, phone_number } = req.body
        if (!name || !email || !password || !role || !phone_number) {
            return res.status(400).json({ message: "All details are required" });
        }

        // Validate password strength
        const passwordErrors = [];
        if (password.length < 8) {
            passwordErrors.push("Password must be at least 8 characters long");
        }
        if (!/[A-Z]/.test(password)) {
            passwordErrors.push("Password must contain at least one uppercase letter");
        }
        if (!/[a-z]/.test(password)) {
            passwordErrors.push("Password must contain at least one lowercase letter");
        }
        if (!/\d/.test(password)) {
            passwordErrors.push("Password must contain at least one number");
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            passwordErrors.push("Password must contain at least one special character");
        }

        if (passwordErrors.length > 0) {
            return res.status(400).json({ 
                message: "Password does not meet requirements",
                passwordErrors: passwordErrors
            });
        }

        // Generate linking PIN for elderly users
        let linkingPin = null;
        if (role === Role.ELDERLY || role === 'ELDERLY') {
            linkingPin = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password,
            options: {
                data: {
                    displayName: name,
                    username: name,
                    role: role,
                    phone_number: phone_number
                },
            },
        })
        
        if (error) {
            console.error("Error Signing up,",error);
            return res.status(401).json({ message: error.message });
        }

        // If elderly user, update profile with linking PIN and send welcome notification
        if (linkingPin && data.user) {
            try {
                // Update user profile with linking PIN
                await supabase
                    .from('user_profiles')
                    .update({ linking_pin: linkingPin })
                    .eq('user_id', data.user.id);

                // Send welcome notification with PIN
                await NotificationService.notifyAccountCreated(data.user.id, linkingPin);
            } catch (notifError) {
                console.error("Error setting up elderly account:", notifError);
                // Don't fail signup if notification fails
            }
        }

        // Notify admins about new user registration
        try {
            await NotificationService.notifyAdminNewUserRegistered(
                name,
                role,
                data.user.id
            );
        } catch (adminNotifError) {
            console.error("Error sending admin notification:", adminNotifError);
            // Don't fail signup if admin notification fails
        }


        // Create record of user accessibility needs defaulted to false for all
        try {
            const result = await UserAccessibilityNeedsService.createUserAccessibilityNeeds(data.user.id);
            
        } catch (error) {
            console.error("Error creating user accessbility needs:", error);
        }

        res.status(201).json({
        message: "Signup successful",
        user: data.user,
        linkingPin: linkingPin // Include PIN in response for elderly users
        });
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.logout = async (req,res)=>{

    try {
        const user=req.session.user;

        if (user){
            const {error} = await supabase
            .from('user_profiles')
            .update({online:false})
            .eq('user_id', user.id);

            if(error){
                console.error("Error updating user online status on logout", error);
            }
        }
        req.logout((err) => {
            if(err){
                return res.status(500).json({ error : 'Logout failed'});
            }
            //Clear session cookie
            res.clearCookie('connect.sid',{
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none':'lax',
                httpOnly : true,
                path:'/',
            });

            req.session.destroy((err) =>{
                if(err){
                    console.error('Session destruction error:', err);
                    return;
                }
                return res.status(200).json({ message: 'Logged out successfully' });
            });
        });
    } catch (err){
        console.error('Logout error',err.message);
        return res.status(500).json({error: 'Error during logout'});
    }
};

exports.status = async(req,res)=>{
    if (req.isAuthenticated()) {
        try{
            const profile=await profiles.getprofile(req.user.id);
            res.json({ authenticated: true,
             user: {
                ...req.user,
                username: profile?.username,
                avatar_url:profile?.avatar_url
             }});
        } catch(err){
            console.error("Error fetching profile:", err);
            res.status(500).json({ 
                authenticated: true,  // Still authenticated, but profile fetch failed
                user: req.user,       // Fall back to basic user data
                error: "Failed to load profile details" 
            });
        }
    }
    else{
        res.json({authenticated:false});
    }
}
exports.profile = async(req,res)=>{
    if (req.isAuthenticated()) {
        try{
            const profile=await profiles.getprofile(req.user.id);
            res.json({ 
             user: {
                ...req.user,
                username: profile?.username,
                avatar_url:profile?.avatar_url,
                online: profile?.online,
             }});
        } catch(err){
            console.error("Error fetching profile:", err);
            res.status(500).json({ 
                user: req.user,       // Fall back to basic user data
                error: "Failed to load profile details" 
            });
        }
        
    }
    else{
        res.json({authenticated:false});
    }
}