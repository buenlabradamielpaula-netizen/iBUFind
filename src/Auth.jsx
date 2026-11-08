
import { useState } from 'react';
import { supabase } from './supabaseClient';

function Auth({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="auth-container">
      <h2>{isLogin ? 'Login to iBUFind' : 'Create an Account'}</h2>

      <button type="button" onClick={onClose}>
  Back to Homepage
</button>

      {!isLogin && (
  <input
    type="text"
    placeholder="Full Name"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
    required
  />
)}
      <form onSubmit={handleAuth}>
        <input
        
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required

        />

        <input
          type="password"
          placeholder="Password (at least 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? 'Please wait...'
            : isLogin
              ? 'Login'
              : 'Sign Up'}
        </button>
      </form>

      {message && <p>{message}</p>}

      <p>
        {isLogin
          ? "Don't have an account?"
          : 'Already have an account?'}
        {' '}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setMessage('');
            setFullName('');
          }}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
}

export default Auth;
