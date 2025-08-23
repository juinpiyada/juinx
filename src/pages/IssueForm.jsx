// src/pages/IssueForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  Alert, 
  Modal,
  Spinner,
  Fade
} from 'react-bootstrap';
import { 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaPaperclip,
  FaLaptopCode,
  FaUserGraduate,
  FaBuilding
} from 'react-icons/fa';
import config from '../config/middleware_config';

const IssueForm = () => {
  const [data, setData] = useState({
    user_id: '',
    issue_type: 'it',
    title: '',
    description: '',
    status: 'open',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const navigate = useNavigate();

  // Get user ID on mount
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      setData(prev => ({ ...prev, user_id: userId }));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Handle input changes
  const handleChange = e => {
    setError('');
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle file changes
  const handleFileChange = e => {
    setError('');
    setFile(e.target.files[0] || null);
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { user_id, issue_type, title, description, status } = data;
    if (!user_id || !issue_type || !title || !description || !status) {
      setError('All fields are required.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('issue_type', issue_type);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('status', status);
    if (file) formData.append('attachment', file);

    try {
      await axios.post(
        config.ISSUES_ROUTE,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      // Show success animation
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
        setShowSuccess(true);
      }, 2000);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message;
      setError(msg);
      setIsSubmitting(false);
    }
  };

  // Close success modal and reset form
  const closePopup = () => {
    const { user_id } = data;
    setData({ user_id, issue_type: 'it', title: '', description: '', status: 'open' });
    setFile(null);
    setShowSuccess(false);
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  // Issue type options with icons
  const issueTypeOptions = [
    { value: 'it', label: 'IT Issues', icon: <FaLaptopCode className="me-2" /> },
    { value: 'student', label: 'Student Issues', icon: <FaUserGraduate className="me-2" /> },
    { value: 'infrastructure', label: 'Infrastructure Issues', icon: <FaBuilding className="me-2" /> }
  ];

  // Status options
  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'allocated', label: 'Allocated' },
    { value: 'work in progress', label: 'Work In Progress' },
    { value: 'submitted back to owner', label: 'Submitted Back To Owner' },
    { value: 'closed', label: 'Closed' }
  ];

  return (
    <Container fluid className="py-5 bg-light min-vh-100">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Fade in={true} appear={true}>
            <div className="bg-white rounded-3 shadow-lg p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 rounded-circle p-3 mb-3">
                  <FaExclamationTriangle className="text-primary fs-1" />
                </div>
                <h2 className="fw-bold text-primary">Submit an Issue</h2>
                <p className="text-muted">Fill out the form below to report an issue</p>
              </div>

              {error && (
                <Alert variant="danger" className="d-flex align-items-center">
                  <FaExclamationTriangle className="me-2" />
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Issue Type</Form.Label>
                  <Form.Select
                    name="issue_type"
                    value={data.issue_type}
                    onChange={handleChange}
                    required
                    className="py-2"
                  >
                    {issueTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.icon}{option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Issue Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    placeholder="Brief description of the issue"
                    value={data.title}
                    onChange={handleChange}
                    required
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    placeholder="Detailed description of the issue"
                    value={data.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="py-2"
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={data.status}
                    onChange={handleChange}
                    required
                    className="py-2"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    <FaPaperclip className="me-2" />
                    Attachment (Optional)
                  </Form.Label>
                  <Form.Control
                    type="file"
                    name="attachment"
                    onChange={handleFileChange}
                    className="py-2"
                  />
                  {file && (
                    <div className="mt-2 text-muted small">
                      <FaPaperclip className="me-1" />
                      {file.name}
                    </div>
                  )}
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-100 py-3 fw-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      Submitting...
                    </>
                  ) : (
                    'Submit Issue'
                  )}
                </Button>
              </Form>
            </div>
          </Fade>
        </Col>
      </Row>

      {/* Success Animation */}
      {showAnimation && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-90"
             style={{ zIndex: 9999 }}>
          <div className="text-center">
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <h3 className="mt-3 fw-bold text-success">Issue Submitted!</h3>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <Modal
        show={showSuccess}
        onHide={closePopup}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Body className="text-center p-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-3 mb-3">
            <FaCheckCircle className="text-success fs-1" />
          </div>
          <h3 className="fw-bold">Success!</h3>
          <p className="text-muted">Your issue has been submitted successfully.</p>
          <Button variant="success" size="lg" onClick={closePopup} className="px-4">
            Go to Dashboard
          </Button>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .success-animation {
          width: 100px;
          height: 100px;
          margin: 0 auto;
        }
        
        .checkmark {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: block;
          stroke-width: 3;
          stroke: #4caf50;
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px #4caf50;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        
        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3;
          stroke-miterlimit: 10;
          stroke: #4caf50;
          fill: #fff;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }
        
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.1, 1.1, 1);
          }
        }
        
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 30px #4caf50;
          }
        }
      `}</style>
    </Container>
  );
};

export default IssueForm;