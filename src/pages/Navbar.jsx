import React from 'react';
import PropTypes from 'prop-types';

// Styles
const navbarStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#343a40',
  padding: '10px 20px',
  color: '#fff',
};
const navLinksContainer = {
  display: 'flex',
  gap: '20px',
};
const linkStyle = {
  color: '#ffc107',
  textDecoration: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
};
const activeLinkStyle = {
  ...linkStyle,
  borderBottom: '2px solid #ffc107',
};

const Navbar = ({ activeSection, onNavigate, onLogout }) => (
  <nav style={navbarStyle}>
    <div style={navLinksContainer}>
      <span
        onClick={() => onNavigate('issues')}
        style={activeSection === 'issues' ? activeLinkStyle : linkStyle}
      >
        🐞 Issues
      </span>
      <span
        onClick={() => onNavigate('users')}
        style={activeSection === 'users' ? activeLinkStyle : linkStyle}
      >
        👥 Users
      </span>
    </div>
    <div>
      <span
        onClick={onLogout}
        style={{ ...linkStyle, color: '#dc3545' }}
      >
        🚪 Logout
      </span>
    </div>
  </nav>
);

Navbar.propTypes = {
  activeSection: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Navbar;
