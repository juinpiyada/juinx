// src/pages/Register.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import config from '../config/middleware_config';

const Register = () => {
  const [data, setData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'User',
    tenant_id: 0,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await axios.post(config.AUTH_REGISTER_ROUTE, data);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          'Registration failed. Check console for details.'
      );
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 20,
  };

  const formStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: 40,
    borderRadius: 20,
    boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    border: '1px solid rgba(255, 255, 255, 0.18)',
  };

  const inputContainerStyle = {
    position: 'relative',
    marginBottom: 5,
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 16px 16px 48px',
    borderRadius: 12,
    border: '1px solid #e0e0e0',
    fontSize: 16,
    outline: 'none',
    transition: 'all 0.3s ease',
    background: 'rgba(255, 255, 255, 0.8)',
  };

  const iconStyle = {
    position: 'absolute',
    left: 18,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9c27b0',
    fontSize: 18,
  };

  const buttonStyle = {
    padding: 16,
    fontSize: 16,
    fontWeight: 600,
    background: 'linear-gradient(135deg, #9c27b0, #673ab7)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  };

  const headingStyle = {
    textAlign: 'center',
    fontSize: 28,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 10,
  };

  const errorStyle = {
    color: '#e53935',
    textAlign: 'center',
    background: 'rgba(229, 57, 53, 0.1)',
    padding: 12,
    borderRadius: 8,
    border: '1px solid rgba(229, 57, 53, 0.2)',
  };

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              ...formStyle,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2,
                type: "spring", 
                stiffness: 260, 
                damping: 20 
              }}
            >
              <FaCheckCircle 
                style={{ 
                  fontSize: 80, 
                  color: '#4caf50',
                  marginBottom: 20 
                }} 
              />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ fontSize: 24, color: '#333', marginBottom: 10 }}
            >
              Registration Successful!
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ color: '#666' }}
            >
              Redirecting to login...
            </motion.p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            style={formStyle}
          >
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              style={headingStyle}
            >
              Create Account
            </motion.h2>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={errorStyle}
              >
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={inputContainerStyle}
            >
              <FaUser style={iconStyle} />
              <input
                type="text"
                name="username"
                placeholder="Username"
                style={inputStyle}
                value={data.username}
                onChange={(e) => setData({ ...data, username: e.target.value })}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={inputContainerStyle}
            >
              <FaEnvelope style={iconStyle} />
              <input
                type="email"
                name="email"
                placeholder="Email"
                style={inputStyle}
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={inputContainerStyle}
            >
              <FaLock style={iconStyle} />
              <input
                type="password"
                name="password"
                placeholder="Password"
                style={inputStyle}
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={inputContainerStyle}
            >
              <FaUserTag style={iconStyle} />
              <select
                name="role"
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                style={inputStyle}
              >
                <option value="User">User</option>
                <option value="IT User">IT User</option>
                <option value="Infrastructure User">Infrastructure User</option>
                <option value="Administrator User">Administrator User</option>
              </select>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              type="submit"
              style={buttonStyle}
              disabled={loading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Creating Account...
                </>
              ) : (
                'Register'
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;