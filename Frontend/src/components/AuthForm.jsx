import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthForm = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', isAdmin: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await registerUser(formData);
        alert('Registration successful! Please login.');
        setIsRegister(false);
      } else {
        const data = await loginUser(formData);
        onLogin(data.user);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '20px auto' }}>
      <h2>{isRegister ? 'Create Account' : 'Admin Login'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Username</label>
          <input 
            type="text" 
            value={formData.username} 
            onChange={(e) => setFormData({...formData, username: e.target.value})} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
        </div>
        {isRegister && (
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              checked={formData.isAdmin} 
              onChange={(e) => setFormData({...formData, isAdmin: e.target.checked})} 
              style={{ width: 'auto' }}
            />
            <label style={{ margin: 0 }}>Register as Admin</label>
          </div>
        )}
        <button type="submit" className="btn-primary">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '10px', cursor: 'pointer', color: 'blue' }} onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
      </p>
    </div>
  );
};

export default AuthForm;