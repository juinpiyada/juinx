import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { Fade, Zoom, Bounce, JackInTheBox } from 'react-awesome-reveal';
import { BsPersonCircle, BsLockFill, BsEyeFill, BsEyeSlashFill, BsShieldCheck, BsArrowRightCircle } from 'react-icons/bs';
import config from '../config/middleware_config';

export default function Login() {
  const [data, setData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!data.username || !data.password) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(config.AUTH_LOGIN_ROUTE, data);
      setLoading(false);
      if (res.data.status === 'ok' && res.data.userId && res.data.role) {
        localStorage.setItem('userId', res.data.userId);
        localStorage.setItem('role', res.data.role);
        if (res.data.user_role) localStorage.setItem('user_role', res.data.user_role);
        localStorage.setItem('username', res.data.username || data.username);
        
        setShowAnimation(true);
        setTimeout(() => {
          const params = new URLSearchParams(location.search);
          const from = params.get('from') || (res.data.role === 'admin' ? '/admin' : '/dashboard');
          navigate(from, { replace: true });
        }, 2500);
      } else {
        setError('Login failed: Invalid response from server');
      }
    } catch (err) {
      setLoading(false);
      setError('Login failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden" 
         style={{ background: 'linear-gradient(135deg, #1a2a6c, #b21f1f, #1a2a6c)', backgroundSize: '400% 400%' }}>
      {/* Animated background elements */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i}
            className="position-absolute rounded-circle bg-white bg-opacity-10"
            style={{
              width: `${Math.random() * 80 + 20}px`,
              height: `${Math.random() * 80 + 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 15 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      <Container className="position-relative z-10">
        <Row className="w-100">
          <Col md={6} lg={4} className="mx-auto">
            {showAnimation ? (
              <div className="text-center py-5">
                <JackInTheBox>
                  <div className="mb-4 d-inline-block p-4 bg-white bg-opacity-20 rounded-circle">
                    <BsShieldCheck className="text-white" style={{ fontSize: '3rem' }} />
                  </div>
                </JackInTheBox>
                <Bounce>
                  <h3 className="text-white mb-3 fw-bold">Authentication Successful!</h3>
                  <p className="text-white-50">Redirecting to your dashboard...</p>
                </Bounce>
                <div className="mt-4">
                  <Spinner animation="grow" variant="light" className="me-2" />
                  <Spinner animation="grow" variant="light" className="me-2" />
                  <Spinner animation="grow" variant="light" />
                </div>
              </div>
            ) : (
              <Zoom>
                <Card className="shadow-lg border-0 rounded-4 overflow-hidden bg-white bg-opacity-95">
                  <Card.Body className="p-4 p-md-5">
                    <div className="text-center mb-4">
                      <Bounce>
                        <div className="d-inline-block p-3 bg-primary bg-opacity-10 rounded-circle mb-3">
                          <BsPersonCircle className="text-primary" style={{ fontSize: '2.5rem' }} />
                        </div>
                      </Bounce>
                      <h2 className="fw-bold text-primary">Welcome Back</h2>
                      <p className="text-muted">Please login to your account</p>
                    </div>
                    
                    {error && (
                      <Alert variant="danger" className="mb-4 d-flex align-items-center">
                        <BsShieldCheck className="me-2" />
                        {error}
                      </Alert>
                    )}
                    
                    <Form onSubmit={handleLogin}>
                      <Form.Group className="mb-3" controlId="username">
                        <Form.Label>Username</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-primary bg-opacity-10 border-0">
                            <BsPersonCircle className="text-primary" />
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="Enter your username"
                            value={data.username}
                            onChange={(e) => setData({ ...data, username: e.target.value })}
                            disabled={loading}
                            className="py-2 border-start-0"
                          />
                        </InputGroup>
                      </Form.Group>
                      
                      <Form.Group className="mb-4" controlId="password">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-primary bg-opacity-10 border-0">
                            <BsLockFill className="text-primary" />
                          </InputGroup.Text>
                          <Form.Control
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={data.password}
                            onChange={(e) => setData({ ...data, password: e.target.value })}
                            disabled={loading}
                            className="py-2 border-start-0 border-end-0"
                          />
                          <InputGroup.Text 
                            className="bg-primary bg-opacity-10 border-0 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? 
                              <BsEyeSlashFill className="text-primary" /> : 
                              <BsEyeFill className="text-primary" />
                            }
                          </InputGroup.Text>
                        </InputGroup>
                      </Form.Group>
                      
                      <Button
                        variant="primary"
                        type="submit"
                        className="w-100 py-2 mb-3 fw-bold d-flex align-items-center justify-content-center"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Logging in...
                          </>
                        ) : (
                          <>
                            Login <BsArrowRightCircle className="ms-2" />
                          </>
                        )}
                      </Button>
                    </Form>
                    
                    <div className="text-center mt-4">
                      <p className="text-muted">
                        Don't have an account?{' '}
                        <Button 
                          variant="link" 
                          className="p-0 text-primary fw-medium text-decoration-none d-inline-flex align-items-center"
                          onClick={() => navigate('/register')}
                        >
                          Register here <BsArrowRightCircle className="ms-1" size={14} />
                        </Button>
                      </p>
                    </div>
                  </Card.Body>
                </Card>
              </Zoom>
            )}
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-20px) translateX(10px) rotate(10deg); opacity: 0.2; }
          100% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}