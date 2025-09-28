const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { supabaseAdmin } = require('./supabase');


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5173/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) =>{
    try{
        const email = profile.emails[0].value;
        
        // try and find user by email
        const { data: users, error:listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) {
          console.error('Error listing users:', listError);
          return done(listError, null);
        }

        // Look for existing user by email or Google provider ID
        const existingUser = users.users.find(user => 
          user.email === email || 
          (user.user_metadata?.provider === 'google' && user.user_metadata?.provider_id === profile.id)
        );
        
        if (existingUser) {
          // Update user metadata if this is their first Google login but they registered differently
          if (!existingUser.user_metadata?.provider || existingUser.user_metadata.provider !== 'google') {
            const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              user_metadata: {
                ...existingUser.user_metadata,
                provider: 'google',
                provider_id: profile.id,
                name: profile.displayName,
                role: profile.role,
                full_name: profile.displayName
              }
            });
            
            if (updateError) {
              console.error('Error updating user metadata:', updateError);
              return done(null, { ...existingUser,isNewUser:false}); // Still return existing user even if update fails
            }
            
            return done(null, { ...updatedUser.user, isNewUser:true});
          }
          
          return done(null, { ...existingUser, isNewUser: false });
        }

         // Create new user if doesn't exist
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: profile.emails[0].value,
        email_confirm: true,
        user_metadata:{
          provider: 'google',
          providerId: profile.id,
          name: profile.displayName,
          role: profile.role,
          full_name: profile.displayName
        }
      });

      if (error) {
        console.error('Error creating user:', error);
        return done(error,null);
      }
        return done(null,{ ...data.user, isNewUser: true });
    }catch (error){
        console.error('Google OAuth error:', error);
        return done(error,null);
    }
}));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error){
      return done(error,null);
    }
    done(null, data.user);
  } catch (error) {
    done(error, null);
  }
});