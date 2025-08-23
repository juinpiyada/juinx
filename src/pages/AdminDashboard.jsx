// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Container, Row, Col, Button, Table, Modal, Form,
  Card, Badge, Spinner, OverlayTrigger, Tooltip, Offcanvas
} from 'react-bootstrap';
import {
  BsBug, BsPeople, BsBoxArrowRight, BsPencil, BsTrash,
  BsPlusLg, BsCheckCircle, BsExclamationCircle, BsPersonFill,
  BsSearch, BsBarChart, BsPieChart, BsEnvelope, BsShield,
  BsSpeedometer, BsList, BsX
} from 'react-icons/bs';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip,
  Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import config from '../config/middleware_config';

ChartJS.register(ArcElement, ChartTooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title);

/* ----------  STATUS BADGE  ---------- */
const StatusBadge = ({ status }) => {
  const map = { open: 'warning', 'in progress': 'info', closed: 'success' };
  const bg = map[status?.toLowerCase()] || 'secondary';
  return <Badge bg={bg} className="px-3 py-1 rounded-pill">{status}</Badge>;
};

/* ----------  CUSTOM SLIDE ALERT  ---------- */
const SlideAlert = ({ show, setShow, icon: Icon, message, variant }) => {
  if (!show) return null;
  const color = variant === 'success' ? '#198754' :
                variant === 'danger'  ? '#dc3545' : '#0d6efd';
  return (
    <div className="position-fixed top-0 start-0 w-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-start py-3"
         style={{ zIndex: 9999, minHeight: '100vh' }}>
      <Card className="shadow-lg border-0 animate__animated animate__slideInDown"
            style={{ maxWidth: 320, borderLeft: `4px solid ${color}` }}>
        <Card.Body className="d-flex align-items-start">
          <div className="me-3" style={{ color }}><Icon size={24} /></div>
          <div>
            <h6 className="mb-1 fw-bold" style={{ color }}>{variant.toUpperCase()}</h6>
            <p className="mb-0">{message}</p>
          </div>
          <Button size="sm" variant="link" className="ms-auto" onClick={() => setShow(false)}>
            <BsX size={20} />
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

/* ----------  CHART COMPONENTS  ---------- */
const IssuesPieChart = ({ issues }) => {
  const data = {
    labels: ['Open', 'In Progress', 'Closed'],
    datasets: [{
      data: [
        issues.filter(i => i.status === 'open').length,
        issues.filter(i => i.status === 'in progress').length,
        issues.filter(i => i.status === 'closed').length
      ],
      backgroundColor: ['#ffc107', '#0dcaf0', '#198754'],
      hoverOffset: 12
    }]
  };
  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    animation: { animateRotate: true, animateScale: true }
  };
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="d-flex flex-column">
        <h6 className="text-muted mb-3"><BsPieChart className="me-2"/>Issues Overview</h6>
        <div style={{ height: 220 }}><Pie data={data} options={opts} /></div>
      </Card.Body>
    </Card>
  );
};

const UserActivityChart = ({ issues }) => {
  const activity = {};
  issues.forEach(i => { activity[i.user_id] = (activity[i.user_id] || 0) + 1; });
  const top = Object.entries(activity).sort(([,a],[,b])=>b-a).slice(0,5);
  const data = {
    labels: top.map(([id]) => `User ${id}`),
    datasets: [{
      label: 'Issues reported',
      data: top.map(([,v])=>v),
      backgroundColor: 'rgba(13,110,253,.8)',
      borderRadius: 4
    }]
  };
  const opts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    animation: { duration: 1500, easing: 'easeOutBounce' },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };
  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Body className="d-flex flex-column">
        <h6 className="text-muted mb-3"><BsBarChart className="me-2"/>Top Reporters</h6>
        <div style={{ height: 220 }}><Bar data={data} options={opts} /></div>
      </Card.Body>
    </Card>
  );
};

/* ----------  STATS CARD  ---------- */
const StatCard = ({ label, value, icon: Icon, color }) => (
  <Card className="border-0 shadow-sm mb-3">
    <Card.Body className="d-flex align-items-center">
      <div className={`bg-${color} bg-opacity-10 p-2 rounded-circle me-3`}>
        <Icon className={`text-${color} fs-4`} />
      </div>
      <div>
        <h4 className="mb-0 fw-bold">{value}</h4>
        <small className="text-muted">{label}</small>
      </div>
    </Card.Body>
  </Card>
);

/* ----------  MAIN COMPONENT  ---------- */
export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('user');
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState({});
  const [alert, setAlert] = useState({ show: false, icon: BsCheckCircle, message: '', variant: 'success' });
  const [showDrawer, setShowDrawer] = useState(false);

  const navigate = useNavigate();

  const toast = (msg, variant = 'success', icon = BsCheckCircle) => {
    setAlert({ show: true, icon, message: msg, variant });
    setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try { await Promise.all([fetchUsers(), fetchIssues()]); }
      catch (e) { toast('Failed to load data', 'danger', BsExclamationCircle); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const fetchUsers = async () => {
    const { data } = await axios.get(config.USERS_ROUTE);
    setUsers(Array.isArray(data) ? data : data.data || []);
  };
  const fetchIssues = async () => {
    const { data } = await axios.get(config.ISSUES_ROUTE);
    setIssues(Array.isArray(data) ? data : data.data || []);
  };

  const getUserById = id => users.find(u => u.id === id)?.username || 'Unassigned';

  /* ---- modal helpers ---- */
  const openUserModal = (mode, user = {}) => {
    setModalType('user'); setModalMode(mode);
    setModalData(mode === 'add'
      ? { tenant_id: '', username: '', email: '', password: '' }
      : { ...user, password: '' });
    setModalOpen(true);
  };
  const openIssueModal = issue => {
    setModalType('issue'); setModalMode('edit');
    setModalData({ id: issue.id, description: issue.description });
    setModalOpen(true);
  };
  const openAssignModal = issue => {
    setModalType('assign');
    setModalData({ id: issue.id, assignee_id: issue.assignee_id || '' });
    setModalOpen(true);
  };

  /* ---- actions ---- */
  const submitUser = async () => {
    const { id, tenant_id, username, email, password } = modalData;
    if (!tenant_id || !username || !email) return toast('Missing fields', 'danger', BsExclamationCircle);
    try {
      modalMode === 'add'
        ? await axios.post(config.USERS_ROUTE, { tenant_id, username, email, password, role: 'User' })
        : await axios.put(config.USER_BY_ID(id), { tenant_id, username, email, password, role: 'User' });
      toast('User saved!', 'success', BsCheckCircle);
      setModalOpen(false); fetchUsers();
    } catch { toast('Save failed', 'danger'); }
  };
  const submitIssue = async () => {
    const { id, description } = modalData;
    if (!String(description).trim()) return;
    try {
      await axios.patch(config.ISSUE_BY_ID(id), { description });
      toast('Issue updated', 'success'); setModalOpen(false); fetchIssues();
    } catch { toast('Update failed', 'danger'); }
  };
  const submitAssign = async () => {
    const { id, assignee_id } = modalData;
    if (!assignee_id) return;
    try {
      await axios.patch(config.ISSUE_BY_ID(id), { assignee_id });
      toast('Assigned', 'success'); setModalOpen(false); fetchIssues();
    } catch { toast('Assign failed', 'danger'); }
  };
  const deleteUser = async id => {
    if (!window.confirm('Delete?')) return;
    try { await axios.delete(config.USER_BY_ID(id)); toast('User deleted'); fetchUsers(); }
    catch { toast('Delete failed', 'danger'); }
  };
  const closeIssue = async id => {
    if (!window.confirm('Close?')) return;
    try { await axios.put(config.ISSUE_CLOSE(id)); toast('Issue closed'); fetchIssues(); }
    catch { toast('Close failed', 'danger'); }
  };
  const logout = () => { localStorage.clear(); navigate('/'); toast('Logged out', 'info'); };

  const openIssues = issues.filter(i => i.status !== 'closed').length;
  const closedIssues = issues.filter(i => i.status === 'closed').length;

  /* ---- render helpers ---- */
  const renderDashboard = () => (
    <>
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}><StatCard label="Total Issues" value={issues.length} icon={BsBug} color="primary"/></Col>
        <Col xs={6} lg={3}><StatCard label="Open" value={openIssues} icon={BsExclamationCircle} color="warning"/></Col>
        <Col xs={6} lg={3}><StatCard label="Users" value={users.length} icon={BsPeople} color="info"/></Col>
        <Col xs={6} lg={3}><StatCard label="Closed" value={closedIssues} icon={BsCheckCircle} color="success"/></Col>
      </Row>
      <Row className="g-4">
        <Col lg={6}><IssuesPieChart issues={issues}/></Col>
        <Col lg={6}><UserActivityChart issues={issues}/></Col>
      </Row>
    </>
  );

  const renderIssues = () => (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-primary"><BsBug className="me-2"/>Issues</h5>
      </Card.Header>
      <Card.Body className="p-0">
        <div className="table-responsive">
          <Table hover className="mb-0 text-nowrap">
            <thead className="table-light"><tr>
              <th>#</th><th>Title</th><th>Status</th><th>Reporter</th><th>Assignee</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="text-center py-3"><Spinner size="sm"/></td></tr> :
               issues.length === 0
               ? <tr><td colSpan="6" className="text-center py-4 text-muted">No issues found</td></tr>
               : issues.map(i=>(
                 <tr key={i.id}>
                   <td><Badge bg="secondary">#{i.id}</Badge></td>
                   <td className="fw-medium">{i.title}</td>
                   <td><StatusBadge status={i.status}/></td>
                   <td><BsPersonFill className="me-1 text-muted"/>{getUserById(i.user_id)}</td>
                   <td>{getUserById(i.assignee_id) || '—'}</td>
                   <td>
                     <OverlayTrigger overlay={<Tooltip>Edit</Tooltip>}><Button size="sm" variant="outline-warning" className="me-1" onClick={()=>openIssueModal(i)}><BsPencil/></Button></OverlayTrigger>
                     <OverlayTrigger overlay={<Tooltip>Assign</Tooltip>}><Button size="sm" variant="outline-primary" className="me-1" onClick={()=>openAssignModal(i)}><BsPeople/></Button></OverlayTrigger>
                     {i.status !== 'closed' && <OverlayTrigger overlay={<Tooltip>Close</Tooltip>}><Button size="sm" variant="outline-success" onClick={()=>closeIssue(i.id)}><BsCheckCircle/></Button></OverlayTrigger>}
                   </td>
                 </tr>))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );

  const renderUsers = () => (
    <Card className="shadow-sm border-0">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0 text-info"><BsPeople className="me-2"/>Users</h5>
        <Button size="sm" variant="success" onClick={()=>openUserModal('add')}>
          <BsPlusLg className="me-1"/>Add
        </Button>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <div className="position-relative">
            <BsSearch className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted"/>
            <Form.Control placeholder="Search users…" className="ps-4" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
          </div>
        </div>
        <div className="table-responsive">
          <Table hover className="mb-0 text-nowrap">
            <thead className="table-light"><tr>
              <th>#</th><th>Tenant</th><th>User</th><th>Email</th><th>Role</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users
                .filter(u=>!searchTerm || u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(u=>(
                  <tr key={u.id}>
                    <td><Badge bg="secondary">#{u.id}</Badge></td>
                    <td><code className="bg-light px-1">{u.tenant_id}</code></td>
                    <td><BsPersonFill className="me-1 text-muted"/>{u.username}</td>
                    <td><BsEnvelope className="me-1 text-muted"/>{u.email}</td>
                    <td><Badge bg="dark" className="rounded-pill">{u.role}</Badge></td>
                    <td>
                      <Button size="sm" variant="outline-warning" className="me-1" onClick={()=>openUserModal('edit',u)}><BsPencil/></Button>
                      <Button size="sm" variant="outline-danger" onClick={()=>deleteUser(u.id)}><BsTrash/></Button>
                    </td>
                  </tr>))}
            </tbody>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );

  return (
    <>
      {/* Sidebar (off-canvas on mobile) — no responsive prop → always manual */}
      <Offcanvas show={showDrawer} onHide={()=>setShowDrawer(false)} className="bg-dark text-white d-lg-none">
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title><BsShield className="me-2"/>Admin Panel</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="d-flex flex-column">
          <div className="flex-grow-1">
            {['dashboard','issues','users'].map(sec=>(
              <Button key={sec} variant={activeSection===sec?'light':'outline-light'}
                className="w-100 mb-2 d-flex align-items-center justify-content-start"
                onClick={()=>{setActiveSection(sec);setShowDrawer(false);}}>
                {sec==='dashboard'?<BsSpeedometer className="me-2"/>:
                 sec==='issues'?<BsBug className="me-2"/>:<BsPeople className="me-2"/>}
                {sec.charAt(0).toUpperCase()+sec.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="outline-light" className="w-100 d-flex align-items-center justify-content-center" onClick={logout}>
            <BsBoxArrowRight className="me-2"/>Logout
          </Button>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Top bar (mobile only) */}
      <div className="d-lg-none bg-primary text-white p-2 d-flex align-items-center">
        <Button variant="link" className="text-white" onClick={()=>setShowDrawer(true)}>
          <BsList size={24}/>
        </Button>
        <span className="ms-2 fw-bold">Admin</span>
      </div>

      {/* Main content */}
      <Container fluid className="p-0">
        <Row className="g-0">
          {/* permanent sidebar on desktop */}
          <Col lg={2} className="d-none d-lg-block bg-dark text-white vh-100 sticky-top">
            <div className="p-3">
              <h5 className="fw-bold mb-4"><BsShield className="me-2"/>Admin Panel</h5>
              {['dashboard','issues','users'].map(sec=>(
                <Button key={sec} variant={activeSection===sec?'light':'outline-light'}
                  className="w-100 mb-2 d-flex align-items-center justify-content-start"
                  onClick={()=>setActiveSection(sec)}>
                  {sec==='dashboard'?<BsSpeedometer className="me-2"/>:
                   sec==='issues'?<BsBug className="me-2"/>:<BsPeople className="me-2"/>}
                  {sec.charAt(0).toUpperCase()+sec.slice(1)}
                </Button>
              ))}
            </div>
            <div className="p-3 mt-auto">
              <Button variant="outline-light" className="w-100 d-flex align-items-center justify-content-center" onClick={logout}>
                <BsBoxArrowRight className="me-2"/>Logout
              </Button>
            </div>
          </Col>

          <Col lg={10} className="p-3 p-lg-4">
            {activeSection === 'dashboard' && renderDashboard()}
            {activeSection === 'issues' && renderIssues()}
            {activeSection === 'users' && renderUsers()}
          </Col>
        </Row>
      </Container>

      {/* Modal */}
      <Modal show={modalOpen} onHide={()=>setModalOpen(false)} centered size="lg">
        <Modal.Header closeButton className={`bg-${modalType==='user'?'success':modalType==='issue'?'warning':'primary'} text-white`}>
          <Modal.Title>
            {modalType==='user'?<><BsPeople className="me-2"/>{modalMode==='add'?'Add':'Edit'} User</>:modalType==='issue'?<><BsPencil className="me-2"/>Edit Issue</>:<><BsPeople className="me-2"/>Assign Issue</>}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalType==='user' && (
            <Form>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Tenant ID</Form.Label><Form.Control value={modalData.tenant_id} onChange={e=>setModalData({...modalData,tenant_id:e.target.value})} placeholder="tenant_1001"/></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Username</Form.Label><Form.Control value={modalData.username} onChange={e=>setModalData({...modalData,username:e.target.value})} placeholder="john"/></Form.Group></Col>
              </Row>
              <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={modalData.email} onChange={e=>setModalData({...modalData,email:e.target.value})} placeholder="john@doe.com"/></Form.Group>
              <Form.Group><Form.Label>Password {modalMode==='edit'&&'(leave blank to keep)'}</Form.Label><Form.Control type="password" value={modalData.password||''} onChange={e=>setModalData({...modalData,password:e.target.value})} placeholder="••••••"/></Form.Group>
            </Form>
          )}
          {modalType==='issue' && <Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={5} value={modalData.description||''} onChange={e=>setModalData({...modalData,description:e.target.value})}/></Form.Group>}
          {modalType==='assign' && <Form.Group><Form.Label>Assign to</Form.Label><Form.Select value={modalData.assignee_id||''} onChange={e=>setModalData({...modalData,assignee_id:Number(e.target.value)})}><option value="">— Select —</option>{users.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}</Form.Select></Form.Group>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>setModalOpen(false)}>Cancel</Button>
          <Button variant={modalType==='user'?'success':modalType==='issue'?'warning':'primary'} onClick={modalType==='user'?submitUser:modalType==='issue'?submitIssue:submitAssign}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Global Slide-in Alert */}
      <SlideAlert show={alert.show} setShow={s=>setAlert({...alert,show:s})} icon={alert.icon} message={alert.message} variant={alert.variant}/>
    </>
  );
}