// src/pages/UserDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config/middleware_config';
import {
  Container, Row, Col, Button, Table, Modal, Form, Image, Stack, Badge, Spinner,
  Alert, Offcanvas, Nav, Card, ListGroup, ProgressBar, Toast, ToastContainer
} from 'react-bootstrap';
import { 
  FaHamburger, FaTimes, FaPlus, FaEdit, FaSave, FaTimesCircle, FaEye, FaComment,
  FaSignOutAlt, FaUser, FaClipboardList, FaThumbtack, FaGlobe, FaImage, FaPaperclip,
  FaChevronLeft, FaChevronRight, FaChartPie, FaExclamationTriangle, FaCheckCircle, FaClock,
  FaBell, FaCheck, FaInfoCircle, FaTrash, FaReply, FaPaperPlane, FaTimes as FaClose
} from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
ChartJS.register(ArcElement, Tooltip, Legend);

export default function UserDashboard() {
  // — Core state —
  const [myIssues, setMyIssues] = useState([]);
  const [allocatedIssues, setAllocatedIssues] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');
  const [remarks, setRemarks] = useState([]);
  const [newRemarkText, setNewRemarkText] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [imgErr, setImgErr] = useState('');
  
  // — Profile state —
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  
  // — Status modal state —
  const [statusModalIssue, setStatusModalIssue] = useState(null);
  const [statusModalUsers, setStatusModalUsers] = useState([]);
  const [statusModalLoading, setStatusModalLoading] = useState(false);
  const [statusModalError, setStatusModalError] = useState('');
  
  // — Pagination state —
  const [currentPageMy, setCurrentPageMy] = useState(1);
  const [currentPageAllocated, setCurrentPageAllocated] = useState(1);
  const [currentPageAll, setCurrentPageAll] = useState(1);
  const itemsPerPage = 5;
  
  // — Chart data state —
  const [statusCounts, setStatusCounts] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0
  });
  
  // — Toast notifications state —
  const [toasts, setToasts] = useState([]);
  
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');
  
  // Modal disclosures
  const [showImageModal, setShowImageModal] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const [modalSrc, setModalSrc] = useState('');
  const [currentRemarksIssue, setCurrentRemarksIssue] = useState(null);
  
  // Toast notification function
  const showToast = (message, type = 'success') => {
    const id = new Date().getTime();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };
  
  // Remove toast manually
  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // fetch user list → find current user → then load issues
  useEffect(() => {
    if (!userId) return navigate('/');
    
    const fetchUserData = async () => {
      try {
        const res = await axios.get(config.USERS_ROUTE);
        const users = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const me = users.find(u => String(u.id) === String(userId));
        
        if (me) {
          setUsername(me.username);
          setUserRole(me.user_role || me.role || '');
        } else {
          setUsername('User');
          setUserRole('Unknown');
        }
      } catch {
        setUsername('User');
        setUserRole('Unknown');
      } finally {
        setProfileLoaded(true);
        fetchMyIssues();
        fetchAllocatedIssues();
        fetchAllIssues();
      }
    };
    
    fetchUserData();
  }, [userId, navigate]);
  
  // Calculate status counts when issues change
  useEffect(() => {
    const counts = {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    };
    
    allIssues.forEach(issue => {
      const status = issue.status.toLowerCase();
      if (status.includes('open')) counts.open++;
      else if (status.includes('progress') || status.includes('in progress')) counts.inProgress++;
      else if (status.includes('resolved')) counts.resolved++;
      else if (status.includes('closed')) counts.closed++;
    });
    
    setStatusCounts(counts);
  }, [allIssues]);
  
  async function fetchMyIssues() {
    try {
      const res = await axios.get(config.ISSUES_BY_REPORTER_USERID(userId));
      setMyIssues(res.data.data || []);
    } catch {
      setError('Failed to fetch your reported issues.');
    }
  }
  
  async function fetchAllocatedIssues() {
    try {
      const res = await axios.get(config.ISSUES_ASSIGNED_TO_USERID(userId));
      setAllocatedIssues(res.data.data || []);
    } catch {
      // ignore
    }
  }
  
  async function fetchAllIssues() {
    try {
      const res = await axios.get(config.ISSUES_ROUTE);
      setAllIssues(res.data.data || res.data || []);
    } catch {
      setError('Failed to fetch all issues.');
    }
  }
  
  async function loadRemarks(issueId) {
    try {
      const res = await axios.get(config.ISSUE_CONVERSATIONS(issueId));
      setRemarks(res.data.data || []);
      setCurrentRemarksIssue(issueId);
      setShowRemarksModal(true);
    } catch {
      showToast('Failed to load conversation.', 'danger');
    }
  }
  
  async function sendRemark(issueId, text) {
    if (!text.trim() && !screenshotFile) return;
    
    try {
      const formData = new FormData();
      formData.append('sender_id', userId);
      formData.append('message_type', 'remark');
      formData.append('message_text', text.trim());
      if (screenshotFile) formData.append('attachment', screenshotFile);
      
      await axios.post(
        config.ISSUE_CONVERSATIONS(issueId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      setNewRemarkText('');
      setScreenshotFile(null);
      loadRemarks(issueId);
      
      showToast('Remark sent successfully!', 'success');
    } catch {
      showToast('Failed to send remark.', 'danger');
    }
  }
  
  function handleLogout() {
    localStorage.clear();
    showToast('Logged out successfully', 'info');
    navigate('/');
  }
  
  function openImageModal(src) {
    setImgErr('');
    setModalSrc(src);
    setShowImageModal(true);
  }
  
  function closeImageModal() {
    setShowImageModal(false);
    setModalSrc('');
    setImgErr('');
  }
  
  function closeRemarks() {
    setShowRemarksModal(false);
    setRemarks([]);
    setNewRemarkText('');
    setScreenshotFile(null);
    setCurrentRemarksIssue(null);
  }
  
  function startEdit(issue) {
    setEditingIssueId(issue.id);
    setEditDescription(issue.description);
  }
  
  async function saveEdit(issueId) {
    try {
      await axios.patch(config.ISSUE_BY_ID(issueId), { description: editDescription });
      setEditingIssueId(null);
      fetchMyIssues();
      fetchAllocatedIssues();
      fetchAllIssues();
      
      showToast('Issue updated successfully!', 'success');
    } catch {
      showToast('Failed to save changes.', 'danger');
    }
  }
  
  function cancelEdit() {
    setEditingIssueId(null);
  }
  
  // Open/close Status modal
  async function openStatusModal(issueId) {
    setStatusModalLoading(true);
    setStatusModalError('');
    setStatusModalIssue(null);
    
    try {
      // Try single issue endpoint first
      let found = null;
      try {
        const resIssue = await axios.get(config.ISSUE_BY_ID(issueId));
        const data = resIssue?.data;
        found = data?.issue ?? data;
      } catch {
        const resAll = await axios.get(config.ISSUES_ROUTE);
        const list = Array.isArray(resAll.data) ? resAll.data : (resAll.data?.data || []);
        found = list.find(i => String(i.id) === String(issueId));
      }
      
      if (!found) throw new Error(`Issue #${issueId} not found`);
      
      const resUsers = await axios.get(config.USERS_ROUTE);
      const userList = Array.isArray(resUsers.data) ? resUsers.data : (resUsers.data?.data || []);
      
      setStatusModalIssue(found);
      setStatusModalUsers(userList);
      setShowStatusModal(true);
    } catch (err) {
      setStatusModalError(err?.response?.data?.message || err.message || 'Failed to load issue details');
    } finally {
      setStatusModalLoading(false);
    }
  }
  
  function closeStatusModal() {
    setShowStatusModal(false);
    setStatusModalIssue(null);
    setStatusModalUsers([]);
    setStatusModalError('');
    setStatusModalLoading(false);
  }
  
  // Prefer direct /uploads/{filename} when we know it; else fall back to /issues/:id/attachment
  function primaryAttachmentSrc(issue) {
    if (issue?.attachment) return config.UPLOAD_FILE(issue.attachment);
    return config.ISSUE_ATTACHMENT(issue.id);
  }
  
  // Enhanced pagination component
  function Pagination({ currentPage, totalPages, setCurrentPage }) {
    if (totalPages <= 1) return null;
    
    return (
      <div className="d-flex justify-content-center align-items-center mt-4">
        <div className="pagination-container">
          <Button 
            variant="outline-primary" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="pagination-btn pagination-prev"
          >
            <FaChevronLeft className="me-1" /> Previous
          </Button>
          
          <div className="pagination-pages">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline-primary"}
                onClick={() => setCurrentPage(page)}
                className={`pagination-page ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button 
            variant="outline-primary" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="pagination-btn pagination-next"
          >
            Next <FaChevronRight className="ms-1" />
          </Button>
        </div>
      </div>
    );
  }
  
  function IssueTable({ issues, currentPage, setCurrentPage }) {
    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = issues.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(issues.length / itemsPerPage);
    
    return (
      <>
        <Card className="mb-4 modern-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table striped bordered hover size="sm" className="modern-table">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: '50px' }}>ID</th>
                    <th style={{ width: '120px' }}>Title</th>
                    <th style={{ width: '180px' }}>Description</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '90px' }}>Created</th>
                    <th style={{ width: '90px' }}>Attachment</th>
                    <th style={{ width: '90px' }}>Remarks</th>
                    <th style={{ width: '100px' }}>Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(issue => (
                    <tr key={issue.id} className="table-row-hover">
                      <td><Badge bg="secondary" className="badge-modern">{issue.id}</Badge></td>
                      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.title}
                      </td>
                      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {editingIssueId === issue.id ? (
                          <Form.Control
                            value={editDescription}
                            onChange={e => setEditDescription(e.target.value)}
                            size="sm"
                            className="modern-input"
                          />
                        ) : (
                          issue.description
                        )}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openStatusModal(issue.id)}
                          title="View full issue status"
                          className="w-100 modern-btn"
                        >
                          {issue.status}
                        </Button>
                      </td>
                      <td>
                        {issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        {issue.attachment ? (
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() => openImageModal(primaryAttachmentSrc(issue))}
                            className="w-100 modern-btn"
                          >
                            <FaImage className="me-1" /> View
                          </Button>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => loadRemarks(issue.id)}
                          className="w-100 modern-btn"
                        >
                          <FaComment className="me-1" /> View
                        </Button>
                      </td>
                      <td>
                        {editingIssueId === issue.id ? (
                          <Stack direction="horizontal" gap={1}>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => saveEdit(issue.id)}
                              className="modern-btn"
                            >
                              <FaSave className="me-1" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={cancelEdit}
                              className="modern-btn"
                            >
                              <FaTimesCircle className="me-1" />
                            </Button>
                          </Stack>
                        ) : (
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() => startEdit(issue)}
                            className="w-100 modern-btn"
                          >
                            <FaEdit className="me-1" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
        
        {/* Enhanced Pagination Controls */}
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </>
    );
  }
  
  // Pie chart data with animation
  const pieData = {
    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
    datasets: [
      {
        data: [statusCounts.open, statusCounts.inProgress, statusCounts.resolved, statusCounts.closed],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
        hoverOffset: 15,
      },
    ],
  };
  
  // Pie chart options with animations
  const pieOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14
          },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 16
        },
        bodyFont: {
          size: 14
        },
        padding: 12,
        cornerRadius: 8
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 2000,
      easing: 'easeOutQuart'
    },
    maintainAspectRatio: false
  };
  
  // Stats cards
  const StatsCard = ({ title, value, icon, bg, text }) => (
    <Card className="h-100 modern-card stats-card">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-circle p-3 me-3 ${bg} text-white stats-icon`}>
          {icon}
        </div>
        <div>
          <h6 className="mb-1 text-muted">{title}</h6>
          <h4 className={`mb-0 ${text}`}>{value}</h4>
        </div>
      </Card.Body>
    </Card>
  );
  
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <div className="d-flex modern-dashboard" style={{ minHeight: '100vh' }}>
      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3 toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            onClose={() => removeToast(toast.id)} 
            show={true} 
            delay={3000} 
            autohide
            bg={toast.type === 'success' ? 'success' : toast.type === 'danger' ? 'danger' : 'info'}
            className="modern-toast"
          >
            <Toast.Header closeButton={false}>
              <div className={`rounded-circle me-2 ${toast.type === 'success' ? 'bg-success' : toast.type === 'danger' ? 'bg-danger' : 'bg-info'} toast-icon`}>
                {toast.type === 'success' ? <FaCheck size={12} color="white" /> : 
                 toast.type === 'danger' ? <FaTimes size={12} color="white" /> : 
                 <FaInfoCircle size={12} color="white" />}
              </div>
              <strong className="me-auto">Notification</strong>
            </Toast.Header>
            <Toast.Body className={toast.type === 'danger' ? 'text-white' : ''}>
              {toast.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
      
      {/* Mobile Hamburger Menu (hidden on desktop) */}
      <Button
        className="position-fixed top-0 start-0 m-3 d-md-none mobile-menu-btn"
        variant="warning"
        onClick={() => setShowSidebar(true)}
      >
        <FaHamburger />
      </Button>
      
      {/* Sidebar */}
      <div 
        className="d-none d-md-block modern-sidebar" 
        style={{ width: '250px', position: 'fixed', height: '100vh', left: 0, top: 0 }}
      >
        <div className="sidebar-header">
          <div className="d-flex align-items-center">
            <FaClipboardList size="24px" className="me-2" />
            <h4 className="mb-0">Dashboard</h4>
          </div>
        </div>
        
        <div className="sidebar-content">
          <Link to="/issue-form" className="text-decoration-none">
            <Button 
              variant="warning" 
              className="w-100 d-flex justify-content-start sidebar-btn primary-btn"
            >
              <FaPlus className="me-2" /> Report New Issue
            </Button>
          </Link>
          
          <Button 
            variant={activeSection === 'dashboard' ? 'warning' : ''}
            className={`w-100 d-flex justify-content-start sidebar-btn ${activeSection !== 'dashboard' ? 'sidebar-btn-secondary' : ''}`}
            onClick={() => setActiveSection('dashboard')}
          >
            <FaChartPie className="me-2" /> Dashboard
          </Button>
          
          <Button 
            variant={activeSection === 'myIssues' ? 'warning' : ''}
            className={`w-100 d-flex justify-content-start sidebar-btn ${activeSection !== 'myIssues' ? 'sidebar-btn-secondary' : ''}`}
            onClick={() => setActiveSection('myIssues')}
          >
            <FaClipboardList className="me-2" /> My Issues
          </Button>
          
          <Button 
            variant={activeSection === 'allocated' ? 'warning' : ''}
            className={`w-100 d-flex justify-content-start sidebar-btn ${activeSection !== 'allocated' ? 'sidebar-btn-secondary' : ''}`}
            onClick={() => setActiveSection('allocated')}
          >
            <FaThumbtack className="me-2" /> Assigned to Me
          </Button>
          
          <Button 
            variant={activeSection === 'all' ? 'warning' : ''}
            className={`w-100 d-flex justify-content-start sidebar-btn ${activeSection !== 'all' ? 'sidebar-btn-secondary' : ''}`}
            onClick={() => setActiveSection('all')}
          >
            <FaGlobe className="me-2" /> All Issues
          </Button>
          
          <div className="sidebar-divider"></div>
          
          <Button 
            variant="outline-light"
            className="w-100 d-flex justify-content-start sidebar-btn logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="me-2" /> Logout
          </Button>
        </div>
      </div>
      
      {/* Mobile Sidebar Drawer */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} className="modern-offcanvas">
        <Offcanvas.Header closeButton className="bg-dark text-white">
          <Offcanvas.Title className="d-flex align-items-center">
            <FaClipboardList size="24px" className="me-2" />
            Dashboard
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="bg-dark text-white">
          <Stack gap={3}>
            <Link to="/issue-form" className="text-decoration-none">
              <Button 
                variant="warning" 
                className="w-100 d-flex justify-content-start"
                onClick={() => setShowSidebar(false)}
              >
                <FaPlus className="me-2" /> Report New Issue
              </Button>
            </Link>
            
            <Button 
              variant={activeSection === 'dashboard' ? 'warning' : ''}
              className={`w-100 d-flex justify-content-start ${activeSection !== 'dashboard' ? 'btn-dark' : ''}`}
              onClick={() => {
                setActiveSection('dashboard');
                setShowSidebar(false);
              }}
            >
              <FaChartPie className="me-2" /> Dashboard
            </Button>
            
            <Button 
              variant={activeSection === 'myIssues' ? 'warning' : ''}
              className={`w-100 d-flex justify-content-start ${activeSection !== 'myIssues' ? 'btn-dark' : ''}`}
              onClick={() => {
                setActiveSection('myIssues');
                setShowSidebar(false);
              }}
            >
              <FaClipboardList className="me-2" /> My Issues
            </Button>
            
            <Button 
              variant={activeSection === 'allocated' ? 'warning' : ''}
              className={`w-100 d-flex justify-content-start ${activeSection !== 'allocated' ? 'btn-dark' : ''}`}
              onClick={() => {
                setActiveSection('allocated');
                setShowSidebar(false);
              }}
            >
              <FaThumbtack className="me-2" /> Assigned to Me
            </Button>
            
            <Button 
              variant={activeSection === 'all' ? 'warning' : ''}
              className={`w-100 d-flex justify-content-start ${activeSection !== 'all' ? 'btn-dark' : ''}`}
              onClick={() => {
                setActiveSection('all');
                setShowSidebar(false);
              }}
            >
              <FaGlobe className="me-2" /> All Issues
            </Button>
            
            <hr className="text-white" />
            
            <Button 
              variant="outline-light"
              className="w-100 d-flex justify-content-start"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" /> Logout
            </Button>
          </Stack>
        </Offcanvas.Body>
      </Offcanvas>
      
      {/* Main Content */}
      <Container 
        fluid 
        className="p-4 main-content" 
        style={{ marginLeft: '250px' }}
      >
        {/* Profile Header */}
        <Row className="mb-4">
          <Col>
            {profileLoaded ? (
              <div className="d-flex align-items-center profile-header">
                <div className="bg-warning rounded-circle d-flex align-items-center justify-content-center me-3 profile-icon" 
                     style={{ width: '60px', height: '60px' }}>
                  <FaUser size="28px" />
                </div>
                <div>
                  <h2 className="mb-0">
                    Welcome, <span className="text-warning">{username}</span>
                  </h2>
                  <Badge bg="warning" text="dark" className="mt-1 profile-badge">{userRole}</Badge>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <Spinner animation="border" variant="warning" className="me-2" />
                <span>Loading profile...</span>
              </div>
            )}
          </Col>
        </Row>
        
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <>
            <Row className="mb-4">
              <Col md={3}>
                <StatsCard 
                  title="Total Issues" 
                  value={allIssues.length} 
                  icon={<FaClipboardList size={20} />}
                  bg="bg-primary"
                  text="text-primary"
                />
              </Col>
              <Col md={3}>
                <StatsCard 
                  title="My Issues" 
                  value={myIssues.length} 
                  icon={<FaUser size={20} />}
                  bg="bg-info"
                  text="text-info"
                />
              </Col>
              <Col md={3}>
                <StatsCard 
                  title="Assigned to Me" 
                  value={allocatedIssues.length} 
                  icon={<FaThumbtack size={20} />}
                  bg="bg-warning"
                  text="text-warning"
                />
              </Col>
              <Col md={3}>
                <StatsCard 
                  title="Open Issues" 
                  value={statusCounts.open} 
                  icon={<FaExclamationTriangle size={20} />}
                  bg="bg-danger"
                  text="text-danger"
                />
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col md={6}>
                <Card className="shadow-sm h-100 modern-card chart-card">
                  <Card.Header className="bg-white">
                    <h5 className="mb-0">Issue Status Distribution</h5>
                  </Card.Header>
                  <Card.Body className="d-flex justify-content-center align-items-center">
                    <div style={{ width: '100%', height: '300px' }}>
                      <Pie data={pieData} options={pieOptions} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <Card className="shadow-sm h-100 modern-card chart-card">
                  <Card.Header className="bg-white">
                    <h5 className="mb-0">Issue Resolution Progress</h5>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Open</span>
                        <span>{statusCounts.open} issues</span>
                      </div>
                      <ProgressBar 
                        now={(statusCounts.open / allIssues.length) * 100 || 0} 
                        variant="danger" 
                        animated 
                        striped 
                        className="progress-modern"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>In Progress</span>
                        <span>{statusCounts.inProgress} issues</span>
                      </div>
                      <ProgressBar 
                        now={(statusCounts.inProgress / allIssues.length) * 100 || 0} 
                        variant="info" 
                        animated 
                        striped 
                        className="progress-modern"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>Resolved</span>
                        <span>{statusCounts.resolved} issues</span>
                      </div>
                      <ProgressBar 
                        now={(statusCounts.resolved / allIssues.length) * 100 || 0} 
                        variant="success" 
                        animated 
                        striped 
                        className="progress-modern"
                      />
                    </div>
                    
                    <div>
                      <div className="d-flex justify-content-between mb-1">
                        <span>Closed</span>
                        <span>{statusCounts.closed} issues</span>
                      </div>
                      <ProgressBar 
                        now={(statusCounts.closed / allIssues.length) * 100 || 0} 
                        variant="secondary" 
                        animated 
                        striped 
                        className="progress-modern"
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Row>
              <Col>
                <h3 className="mb-4 d-flex align-items-center section-title">
                  <FaClock className="me-2 text-warning" /> Recent Issues
                </h3>
                <Card className="shadow-sm modern-card">
                  <Card.Body className="p-0">
                    <div className="table-responsive">
                      <Table striped bordered hover size="sm" className="modern-table">
                        <thead className="table-dark">
                          <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allIssues.slice(0, 5).map(issue => (
                            <tr key={issue.id} className="table-row-hover">
                              <td><Badge bg="secondary" className="badge-modern">{issue.id}</Badge></td>
                              <td>{issue.title}</td>
                              <td>
                                <Badge 
                                  bg={
                                    issue.status.toLowerCase().includes('open') ? 'danger' :
                                    issue.status.toLowerCase().includes('progress') ? 'info' :
                                    issue.status.toLowerCase().includes('resolved') ? 'success' : 'secondary'
                                  }
                                  className="badge-modern"
                                >
                                  {issue.status}
                                </Badge>
                              </td>
                              <td>{issue.created_at ? new Date(issue.created_at).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
        
        {/* Content Sections */}
        {activeSection === 'myIssues' && (
          <Row>
            <Col>
              <h2 className="mb-4 d-flex align-items-center section-title">
                <FaClipboardList className="me-2 text-warning" /> My Reported Issues
              </h2>
              {myIssues.length ? (
                <IssueTable 
                  issues={myIssues} 
                  currentPage={currentPageMy}
                  setCurrentPage={setCurrentPageMy}
                />
              ) : (
                <Card className="text-center p-5 shadow-sm modern-card empty-state-card">
                  <FaClipboardList size={48} className="text-muted mb-3" />
                  <p className="mb-3">No issues reported yet.</p>
                  <Link to="/issue-form" className="d-inline-block">
                    <Button variant="warning" className="modern-btn">
                      <FaPlus className="me-2" /> Report Your First Issue
                    </Button>
                  </Link>
                </Card>
              )}
            </Col>
          </Row>
        )}
        
        {activeSection === 'allocated' && (
          <Row>
            <Col>
              <h2 className="mb-4 d-flex align-items-center section-title">
                <FaThumbtack className="me-2 text-warning" /> Issues Assigned to Me
              </h2>
              {allocatedIssues.length ? (
                <IssueTable 
                  issues={allocatedIssues} 
                  currentPage={currentPageAllocated}
                  setCurrentPage={setCurrentPageAllocated}
                />
              ) : (
                <Card className="text-center p-5 shadow-sm modern-card empty-state-card">
                  <FaThumbtack size={48} className="text-muted mb-3" />
                  <p className="mb-0">No issues assigned to you.</p>
                </Card>
              )}
            </Col>
          </Row>
        )}
        
        {activeSection === 'all' && (
          <Row>
            <Col>
              <h2 className="mb-4 d-flex align-items-center section-title">
                <FaGlobe className="me-2 text-warning" /> All System Issues
              </h2>
              {allIssues.length ? (
                <IssueTable 
                  issues={allIssues} 
                  currentPage={currentPageAll}
                  setCurrentPage={setCurrentPageAll}
                />
              ) : (
                <Card className="text-center p-5 shadow-sm modern-card empty-state-card">
                  <FaGlobe size={48} className="text-muted mb-3" />
                  <p className="mb-3">No issues in the system.</p>
                  <Link to="/issue-form" className="d-inline-block">
                    <Button variant="warning" className="modern-btn">
                      <FaPlus className="me-2" /> Report First Issue
                    </Button>
                  </Link>
                </Card>
              )}
            </Col>
          </Row>
        )}
      </Container>
      
      {/* Image Modal */}
      <Modal show={showImageModal} onHide={closeImageModal} size="xl" className="modern-modal">
        <Modal.Header closeButton>
          <Modal.Title>Attachment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {imgErr ? (
            <Alert variant="danger">{imgErr}</Alert>
          ) : (
            <div className="text-center">
              <Image
                src={modalSrc}
                alt="Attachment"
                style={{ maxHeight: '70vh' }}
                onError={() => setImgErr('Attachment not found or inaccessible.')}
                fluid
                className="modal-image"
              />
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      {/* Conversation Modal with Stunning Animation */}
      <CSSTransition
        in={showRemarksModal}
        timeout={300}
        classNames="conversation-modal"
        unmountOnExit
      >
        <Modal 
          show={showRemarksModal} 
          onHide={closeRemarks} 
          size="lg" 
          className="modern-modal conversation-modal-wrapper"
          backdropClassName="conversation-modal-backdrop"
        >
          <Modal.Header closeButton className="conversation-modal-header">
            <Modal.Title className="d-flex align-items-center">
              <FaComment className="me-2 text-warning" />
              Conversation for Issue #{currentRemarksIssue}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="conversation-modal-body">
            <div className="conversation-container">
              {remarks.length > 0 ? (
                <TransitionGroup>
                  {remarks.map(msg => (
                    <CSSTransition
                      key={msg.id}
                      timeout={500}
                      classNames="conversation-message"
                    >
                      <div className="conversation-message">
                        <div className="message-header">
                          <div className="message-sender">
                            <strong>{msg.sender_name}</strong>
                          </div>
                          <div className="message-time">
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="message-content">
                          <p>{msg.message_text}</p>
                          {msg.attachment_url && (
                            <div className="message-attachment">
                              <Image
                                src={msg.attachment_url}
                                alt="Screenshot"
                                onClick={() => openImageModal(msg.attachment_url)}
                                thumbnail
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CSSTransition>
                  ))}
                </TransitionGroup>
              ) : (
                <div className="empty-conversation">
                  <FaComment size={48} className="text-muted mb-3" />
                  <p className="text-muted">No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>
            
            <div className="conversation-input-container">
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={newRemarkText}
                  onChange={e => setNewRemarkText(e.target.value)}
                  placeholder="Type your message..."
                  className="modern-input conversation-input"
                />
              </Form.Group>
              
              <div className="d-flex align-items-center mb-3">
                <Form.Label className="me-2 mb-0">
                  <FaPaperclip className="text-muted" />
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={e => setScreenshotFile(e.target.files[0])}
                  className="modern-input file-input"
                />
              </div>
              
              {screenshotFile && (
                <div className="preview-container mb-3">
                  <strong>Preview:</strong>
                  <div className="preview-image-container">
                    <Image
                      src={URL.createObjectURL(screenshotFile)}
                      alt="Preview"
                      thumbnail
                    />
                    <Button 
                      variant="danger" 
                      size="sm" 
                      className="preview-remove-btn"
                      onClick={() => setScreenshotFile(null)}
                    >
                      <FaClose />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="d-flex justify-content-end">
                <Button 
                  variant="outline-secondary" 
                  onClick={closeRemarks} 
                  className="me-2 modern-btn-outline conversation-cancel-btn"
                >
                  Cancel
                </Button>
                <Button
                  variant="warning"
                  disabled={!newRemarkText.trim() && !screenshotFile}
                  onClick={() => sendRemark(currentRemarksIssue, newRemarkText)}
                  className="modern-btn conversation-send-btn"
                >
                  <FaPaperPlane className="me-2" /> Send
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </CSSTransition>
      
      {/* Status Details Modal */}
      <Modal show={showStatusModal} onHide={closeStatusModal} size="lg" className="modern-modal">
        <Modal.Header closeButton>
          <Modal.Title>Issue Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {statusModalLoading ? (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" variant="warning" size="lg" />
            </div>
          ) : statusModalError ? (
            <Alert variant="danger">{statusModalError}</Alert>
          ) : statusModalIssue ? (
            <div className="issue-details">
              <h3 className="mb-4">Issue #{statusModalIssue.id}</h3>
              
              <hr className="mb-4" />
              
              <div className="mb-3">
                <strong>Title:</strong>
                <p>{statusModalIssue.title}</p>
              </div>
              
              <div className="mb-3">
                <strong>Description:</strong>
                <p>{statusModalIssue.description}</p>
              </div>
              
              <div className="mb-3">
                <strong>Status:</strong>
                <div>
                  <Badge 
                    bg={
                      statusModalIssue.status.toLowerCase().includes('open') ? 'danger' :
                      statusModalIssue.status.toLowerCase().includes('progress') ? 'info' :
                      statusModalIssue.status.toLowerCase().includes('resolved') ? 'success' : 'secondary'
                    }
                    className="badge-modern"
                  >
                    {statusModalIssue.status}
                  </Badge>
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Reported by:</strong>
                <p>
                  {statusModalUsers.find(u => String(u.id) === String(statusModalIssue.user_id))?.username || 'Unknown User'}
                  &nbsp;(ID: {statusModalIssue.user_id})
                </p>
              </div>
              
              <div className="mb-3">
                <strong>Assigned to:</strong>
                <p>
                  {statusModalIssue.assignee_id
                    ? (statusModalUsers.find(u => String(u.id) === String(statusModalIssue.assignee_id))?.username || 'Unknown User')
                    : 'Unassigned'}
                  {statusModalIssue.assignee_id && ` (ID: ${statusModalIssue.assignee_id})`}
                </p>
              </div>
              
              {statusModalIssue.attachment && (
                <div className="mb-3">
                  <strong>Attachment:</strong>
                  <div>
                    <Button
                      variant="info"
                      onClick={() => openImageModal(primaryAttachmentSrc(statusModalIssue))}
                      className="modern-btn"
                    >
                      <FaPaperclip className="me-1" /> View Attachment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Modal.Body>
      </Modal>
      
      {/* Custom styles for modern dashboard */}
      <style jsx>{`
        .modern-dashboard {
          background-color: #f5f7fa;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .modern-sidebar {
          background: linear-gradient(180deg, #2c3e50 0%, #1a252f 100%);
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }
        
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-content {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .sidebar-btn {
          border: none;
          border-radius: 8px;
          padding: 12px 15px;
          font-weight: 500;
          transition: all 0.3s ease;
          text-align: left;
        }
        
        .sidebar-btn:hover {
          transform: translateX(5px);
        }
        
        .sidebar-btn-secondary {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .sidebar-btn-secondary:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .primary-btn {
          background-color: #f39c12;
          color: #1a252f;
          font-weight: 600;
        }
        
        .primary-btn:hover {
          background-color: #e67e22;
          color: white;
        }
        
        .sidebar-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.1);
          margin: 15px 0;
        }
        
        .logout-btn {
          margin-top: auto;
        }
        
        .main-content {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .profile-header {
          padding: 15px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .profile-icon {
          box-shadow: 0 4px 8px rgba(243, 156, 18, 0.3);
        }
        
        .profile-badge {
          font-size: 0.85rem;
          padding: 5px 10px;
        }
        
        .modern-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .modern-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .stats-card {
          transition: all 0.3s ease;
        }
        
        .stats-card:hover {
          transform: translateY(-5px);
        }
        
        .stats-icon {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .chart-card {
          height: 100%;
        }
        
        .modern-table {
          border-radius: 8px;
          overflow: hidden;
        }
        
        .modern-table th {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.5px;
        }
        
        .table-row-hover:hover {
          background-color: rgba(243, 156, 18, 0.05);
        }
        
        .modern-btn {
          border-radius: 8px;
          font-weight: 500;
          padding: 8px 12px;
          transition: all 0.3s ease;
          border: none;
        }
        
        .modern-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .modern-btn-outline {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .modern-btn-outline:hover {
          transform: translateY(-2px);
        }
        
        .modern-input {
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          transition: all 0.3s ease;
        }
        
        .modern-input:focus {
          border-color: #f39c12;
          box-shadow: 0 0 0 0.25rem rgba(243, 156, 18, 0.25);
        }
        
        .badge-modern {
          font-size: 0.75rem;
          padding: 5px 8px;
          border-radius: 6px;
        }
        
        .progress-modern {
          height: 10px;
          border-radius: 10px;
        }
        
        .section-title {
          font-weight: 600;
          color: #2c3e50;
          padding-bottom: 10px;
          border-bottom: 2px solid #f39c12;
          display: inline-block;
        }
        
        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem !important;
        }
        
        .modern-modal .modal-content {
          border-radius: 12px;
          border: none;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .modal-image {
          border-radius: 8px;
        }
        
        /* Enhanced Pagination Styles */
        .pagination-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .pagination-btn {
          border-radius: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .pagination-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .pagination-pages {
          display: flex;
          gap: 5px;
        }
        
        .pagination-page {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          padding: 0;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .pagination-page:hover {
          transform: translateY(-2px);
        }
        
        .pagination-page.active {
          background-color: #f39c12;
          border-color: #f39c12;
        }
        
        /* Conversation Modal Styles */
        .conversation-modal-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .conversation-modal-enter {
          opacity: 0;
          transform: scale(0.8);
        }
        
        .conversation-modal-enter-active {
          opacity: 1;
          transform: scale(1);
          transition: opacity 300ms, transform 300ms;
        }
        
        .conversation-modal-exit {
          opacity: 1;
          transform: scale(1);
        }
        
        .conversation-modal-exit-active {
          opacity: 0;
          transform: scale(0.8);
          transition: opacity 300ms, transform 300ms;
        }
        
        .conversation-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1040;
        }
        
        .conversation-modal-header {
          background: linear-gradient(90deg, #f39c12, #e67e22);
          color: white;
          border-radius: 12px 12px 0 0;
          border: none;
        }
        
        .conversation-modal-body {
          padding: 0;
          display: flex;
          flex-direction: column;
          height: 70vh;
        }
        
        .conversation-container {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 0 0 12px 12px;
        }
        
        .conversation-message {
          margin-bottom: 15px;
          padding: 15px;
          border-radius: 12px;
          background-color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #f39c12;
        }
        
        .conversation-message-enter {
          opacity: 0;
          transform: translateY(20px);
        }
        
        .conversation-message-enter-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 500ms, transform 500ms;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .message-sender {
          font-weight: 600;
          color: #2c3e50;
        }
        
        .message-time {
          font-size: 0.8rem;
          color: #6c757d;
        }
        
        .message-content {
          color: #495057;
        }
        
        .message-attachment img {
          max-width: 200px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.3s ease;
        }
        
        .message-attachment img:hover {
          transform: scale(1.05);
        }
        
        .empty-conversation {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #6c757d;
        }
        
        .conversation-input-container {
          padding: 20px;
          background-color: white;
          border-top: 1px solid #e9ecef;
          border-radius: 0 0 12px 12px;
        }
        
        .conversation-input {
          border-radius: 12px;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .conversation-input:focus {
          border-color: #f39c12;
          box-shadow: 0 0 0 0.25rem rgba(243, 156, 18, 0.25);
        }
        
        .file-input {
          border: none;
          padding: 0;
        }
        
        .preview-container {
          position: relative;
        }
        
        .preview-image-container {
          position: relative;
          display: inline-block;
        }
        
        .preview-image-container img {
          max-width: 100%;
          max-height: 200px;
          border-radius: 8px;
        }
        
        .preview-remove-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        
        .conversation-cancel-btn {
          border-radius: 20px;
        }
        
        .conversation-send-btn {
          border-radius: 20px;
          background-color: #f39c12;
          border: none;
        }
        
        .conversation-send-btn:hover {
          background-color: #e67e22;
        }
        
        .issue-details {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        .toast-container {
          z-index: 9999;
        }
        
        .modern-toast {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .toast-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mobile-menu-btn {
          z-index: 1000;
          border-radius: 50%;
          width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modern-offcanvas .offcanvas-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        @media (max-width: 768px) {
          .main-content {
            margin-left: 0 !important;
            padding-top: 60px;
          }
          
          .modern-sidebar {
            display: none;
          }
          
          .conversation-modal-body {
            height: 90vh;
          }
        }
      `}</style>
    </div>
  );
}