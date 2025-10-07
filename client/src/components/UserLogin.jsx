import React, { useState } from 'react';
import { FaReact } from 'react-icons/fa6';
import '../style.css';
import _ from 'lodash';

const UserLogin = ({ setUser }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleAuth = async () => {
    if (!email || !password || (isSignup && !username)) {
      setError('All fields are required');
      return;
    }

    const endpoint = isSignup ? '/auth/signup' : '/auth/login';
    const body = isSignup
      ? { 
          email, 
          password, 
          username, 
          avatar: `https://picsum.photos/id/${_.random(1, 1000)}/200/300` 
        }
      : { email, password };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.user) {
        // For login/signup, extract the access token properly
       // After successful login or signup
if (data.user) {
  const userWithToken = {
    ...data.user,
    access_token: data.user.access_token // store token
  };
  localStorage.setItem('access_token', userWithToken.access_token);
  localStorage.setItem('user', JSON.stringify(userWithToken));
  setUser(userWithToken);
}

      }
    } catch (err) {
      setError('Server error, try again later');
      console.error(err);
    }
  };

  return (
    <div className='login-container-wrapper'>
<div className='login_container'>
      <div className='login_title'>
        <FaReact className='login_icon' />
        <h1>Chat App</h1>
      </div>

      <div className='login_form'>
        {isSignup && (
          <input
            type="text"
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder='Password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleAuth}>{isSignup ? 'Signup' : 'Login'}</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p 
          onClick={() => setIsSignup(!isSignup)} 
          style={{ cursor: 'pointer', marginTop: '10px' }}
        >
          {isSignup ? 'Already have an account? Login' : "Don't have an account? Signup"}
        </p>
      </div>
    </div>
    </div>
    
  );
};

export default UserLogin;
