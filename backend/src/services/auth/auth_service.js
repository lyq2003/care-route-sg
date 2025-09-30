const profiles = require('../profiles');
const { supabase }=require('../../config/supabase');

// Login
exports.login = async (req,res)=>{
    try {
        const { email, password } = req.body

        if (!email || !password) {
        return res.status(400).json({ message: "Phone and password are required" });
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
        const {name, email, password, role } = req.body
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All details are required" });
        }

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password,
            options: {
                data: {
                    displayName: name,
                    username: name,
                    role: role
                },
            },
        })
        
        if (error) {
            console.error("Error Signing up,",error);
            return res.status(401).json({ message: error.message });
        }

        res.status(201).json({
        message: "Signup successful",
        user: data.user,
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