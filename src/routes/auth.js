import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const passportConfig = () => {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile received:', profile?.displayName, profile?.emails?.[0]?.value);
      
      if (!profile.emails || !profile.emails[0]) {
        return done(new Error('No email found'));
      }
      
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          user.googleId = profile.id;
          user.avatar = profile.photos[0]?.value;
          await user.save();
        } else {
          user = new User({
            email: profile.emails[0].value,
            name: profile.displayName,
            googleId: profile.id,
            avatar: profile.photos[0]?.value
          });
          await user.save();
        }
      }
      
      done(null, user);
    } catch (err) {
      console.error('Google auth error:', err);
      done(err, null);
    }
  }));
};

passportConfig();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    try {
      const token = jwt.sign(
        { userId: req.user._id, email: req.user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      const userData = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar
      };
      
      console.log('Google login success:', userData.email);
      
      res.redirect(`http://localhost:5173/login?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
    } catch (err) {
      console.error('Callback error:', err);
      res.redirect('http://localhost:5173/login?error=callback_error');
    }
  }
);

router.put('/update', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { name },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
