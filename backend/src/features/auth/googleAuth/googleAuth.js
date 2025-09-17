const profiles = require('../../profile/profiles');
const { supabase }=require('../../../config/supabase');

// Login
exports.handleOauthCallback = async(req, res) =>{
    try{
        const user= req.user;
        const{ data:profile,error }=await supabase
        .from('user_profiles')
        .select('username,avatar_url')
        .eq('user_id',user.id)
        .single();
        
        if(error){
            console.error('Error fetching user profile:', error.message);
        }

        // set session data
        req.session.user ={ 
            ...user,
            username:profile?.username||null,
            avatar_url:profile?.avatar_url||null,
            online: true,
        };
        // save session
        req.session.save(async (err) => {
            if (err){
                console.error('Session save error:', err);
                return res.status(500).send('Session save failed');
            }

            // Update online status in db
            const {error:updateError}=await supabase
                .from('user_profiles')
                .update({online: true})
                .eq('user_id', user.id);

            if (updateError){
                console.error('Error updating user online status:',updateError);
            }

            // Check if this is a new user and redirect accordingly
            if (req.user.isNewUser) {
                res.redirect(`${process.env.CLIENT_URL}/auth/success?newUser=true` || 'http://localhost:5173/auth/success?newUser=true');
            } else {
                res.redirect(`${process.env.CLIENT_URL}/auth/success?newUser=false` || 'http://localhost:5173/auth/success?newUser=false');
            }
        });
    }catch (err){
        console.error('Oauth callback error:', err.message);
        res.status(500).send('Internal server error during OAuth callback');
    }

};