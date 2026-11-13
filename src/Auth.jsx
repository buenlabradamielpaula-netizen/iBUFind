
import { useState } from 'react';
import { supabase } from './supabaseClient';

function Auth({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) throw error;

const currentName = data.user.user_metadata?.full_name;

if (!currentName) {
  const name = prompt('Please enter your full name:');

  if (name && name.trim()) {
    const { error: updateError } = await supabase.auth.updateUser({
      data: { full_name: name.trim() }
    });

    if (updateError) {
      console.error('Name update error:', updateError);
    } else {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: name.trim()
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
      }
    }
  }
}

        if (error) throw error;

        setMessage('Login successful!');
      } else {
        const { data, error } = await supabase.auth.signUp({
         email,
         password,
         options: {
          data: {
           full_name: fullName
          }
         }
      });
        if (error) throw error;

        if (data.session) {
          setMessage('Account created successfully!');
        } else {
          setMessage('Please check your email to confirm your account.');
        }
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="auth-page">
      <div className="auth-card">

        <button
          type="button"
          className="auth-back-button"
          onClick={onClose}
        >
          ← Back to Homepage
        </button>

        <div className="auth-brand">
          <div className="auth-logo">🔎</div>
          <h2>
            iBU<span>Find</span>
          </h2>
          <p>BICOL UNIVERSITY LOST & FOUND SYSTEM</p>
        </div>

        <div className="auth-heading">
          <h1>
            {isLogin ? 'Welcome Back!' : 'Create Your Account'}
          </h1>
          <p>
            {isLogin
              ? 'Log in to continue finding and reconnecting with your belongings.'
              : 'Join our university community and help lost belongings find their way home.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">

          {!isLogin && (
            <div className="auth-input-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            
<div className="auth-password-wrapper">
  <input
    type={showPassword ? 'text' : 'password'}
    placeholder="Enter your password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    minLength={6}
    required
  />

  
<button
  type="button"
  className="auth-password-toggle"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? 'Hide password' : 'Show password'}
>
  {showPassword ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A11 11 0 0 1 12 5c6.4 0 10 7 10 7a13 13 0 0 1-3 3.8" />
      <path d="M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1 0 2-.2 2.9-.5" />
    </svg>
  )}
</button>

</div>

          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Log In →'
                : 'Create Account →'}
          </button>

        </form>

        {message && (
          <p className="auth-message">{message}</p>
        )}

        <div className="auth-switch">
          <span>
            {isLogin
              ? "Don't have an account?"
              : 'Already have an account?'}
          </span>

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage('');
              setFullName('');
            }}
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>

        <div className="auth-footer">
          Helping our university community reconnect with their belongings.
        </div>

      </div>
    </div>
  );
}

export default Auth;
