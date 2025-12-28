import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getIncidents } from '../services/api';
import IncidentForm from '../components/IncidentForm';
import IncidentList from '../components/IncidentList';
import AdminPanel from '../components/AdminPanel';
import AuthForm from '../components/AuthForm';
import MapView from '../components/MapView';

import logoImg from '../../assets/logo.png';
import workingImg from '../../assets/working.png';

// Connect to Socket.IO
const socket = io('http://localhost:5000');

const Navbar = ({ activeTab, setActiveTab, user, setUser, isMenuOpen, setIsMenuOpen }) => (
  <nav className="navbar">
    <div className="container nav-container">
      <div className="logo" onClick={() => setActiveTab('home')}>
        <img src={logoImg} alt="JanRaksha" style={{ width: '40px', height: '40px', objectFit: 'contain', marginRight: '10px' }} />
        <span>JanRaksha</span>
      </div>
      
      <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }}>
            Home
        </button>
        <button className={activeTab === 'report' ? 'active' : ''} onClick={() => { setActiveTab('report'); setIsMenuOpen(false); }}>
            Report Incident
        </button>
        <button className={activeTab === 'view' ? 'active' : ''} onClick={() => { setActiveTab('view'); setIsMenuOpen(false); }}>
            View Reports
        </button>
        <button className={activeTab === 'admin' ? 'active' : ''} onClick={() => { setActiveTab('admin'); setIsMenuOpen(false); }}>
            {user ? 'Admin Panel' : 'Admin Login'}
        </button>
        {user && activeTab === 'admin' && (
            <button onClick={() => { setUser(null); setIsMenuOpen(false); }} className="btn-logout" style={{background: '#e63946', color: 'white'}}>
                Logout
            </button>
        )}
      </div>

      <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '30px', height: '30px' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </div>
    </div>
  </nav>
);

const LandingPage = ({ onNavigate, userLocation, incidents = [] }) => {
  const totalIncidents = incidents.length;
  const incidentsToday = incidents.filter(inc => new Date(inc.createdAt).toDateString() === new Date().toDateString()).length;
  return (
  <div className="landing-page">
    {userLocation && (
      <div style={{ background: '#f1faee', color: '#1d3557', padding: '10px', textAlign: 'center', fontSize: '0.9rem', borderBottom: '1px solid #ddd' }}>
        📍 You are currently at: <strong>{userLocation}</strong>
      </div>
    )}
    <div className="hero-banner" style={{ width: '100%', backgroundColor: '#1d3557', padding: '100px 20px', textAlign: 'center', color: 'white' }}>
       <div style={{ maxWidth: '800px', margin: '0 auto' }}>
           <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '20px', fontWeight: 'bold' }}>JanRaksha</h1>
           <p style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', marginBottom: '40px', opacity: 0.9 }}>
             Real-Time Incident Reporting & Response Platform
           </p>
           <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px' }}>
               <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e63946' }}>{incidentsToday}</div>
                   <div style={{ fontSize: '1rem', opacity: 0.9 }}>Incidents Today</div>
               </div>
               <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#e63946' }}>{totalIncidents}</div>
                   <div style={{ fontSize: '1rem', opacity: 0.9 }}>Total Reports</div>
               </div>
           </div>
           <button className="btn-cta" onClick={() => onNavigate('report')}>
             Report an Incident Now
           </button>
       </div>
    </div>
    
    <div className="mobile-hero" style={{ padding: '40px 20px', textAlign: 'center', background: '#1d3557', color: 'white' }}>
       <h1 style={{ fontSize: '2rem', marginBottom: '15px' }}>JanRaksha</h1>
       <p style={{ marginBottom: '25px', opacity: 0.9 }}>Real-Time Incident Reporting & Response Platform</p>
       <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px' }}>
           <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e63946' }}>{incidentsToday}</div>
               <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Today</div>
           </div>
           <div style={{ textAlign: 'center' }}>
               <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e63946' }}>{totalIncidents}</div>
               <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total</div>
           </div>
       </div>
       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
         <button className="btn-cta" onClick={() => onNavigate('report')} style={{ width: '100%', maxWidth: '300px' }}>
           Report an Incident Now
         </button>
         <a href="tel:112" className="btn-cta" style={{ background: '#fff', color: '#e63946', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '300px' }}>
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
           </svg>
           Call Emergency (112)
         </a>
       </div>
    </div>

    <div className="container">
        <section className="features">
        <div className="feature-card">
            <div className="feature-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="feature-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
            </div>
            <h3>Instant Reporting</h3>
            <p>Report accidents, fires, or medical emergencies in seconds with geolocation and photo evidence.</p>
        </div>
        <div className="feature-card">
            <div className="feature-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="feature-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
            </div>
            <h3>Live Map Tracking</h3>
            <p>View incidents on an interactive map in real-time to stay informed about safety in your area.</p>
        </div>
        <div className="feature-card">
            <div className="feature-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="feature-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            </div>
            <h3>Admin Verification</h3>
            <p>Authorities can verify, manage, and resolve incidents efficiently through a dedicated dashboard.</p>
        </div>
        </section>

        <section className="how-it-works" style={{ padding: '40px 0', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: '#1d3557' }}>How It Works</h2>
            <img src={workingImg} alt="How JanRaksha Works" style={{ maxWidth: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
        </section>

        <section className="future-features" style={{ padding: '60px 0', textAlign: 'center' }}>
            <div className="container">
                <h2 style={{ fontSize: '2rem', marginBottom: '40px', color: '#1d3557' }}>Future Roadmap</h2>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px' }}>
                    <div className="feature-card" style={{ padding: '20px', border: '1px solid #eee' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🤖</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>AI-Powered Triage</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Automated severity assessment using machine learning to prioritize critical incidents instantly.</p>
                    </div>
                    <div className="feature-card" style={{ padding: '20px', border: '1px solid #eee' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📶</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Offline Mode</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Report incidents even without internet connectivity. Data syncs automatically when online.</p>
                    </div>
                    <div className="feature-card" style={{ padding: '20px', border: '1px solid #eee' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🗣️</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Multi-language Support</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Real-time translation for incident descriptions to bridge communication gaps.</p>
                    </div>
                    <div className="feature-card" style={{ padding: '20px', border: '1px solid #eee' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🚁</div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Drone Integration</h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Deploying autonomous drones for rapid aerial surveillance and medical supply delivery.</p>
                    </div>
                </div>
            </div>
        </section>

        <footer style={{ backgroundColor: '#1d3557', color: 'white', padding: '40px 0 20px' }}>
            <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '30px' }}>
                <div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>JanRaksha</span>
                    </h3>
                    <p style={{ opacity: 0.8 }}>Empowering communities with real-time emergency response and coordination.</p>
                </div>
                <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '15px', borderBottom: '2px solid #e63946', display: 'inline-block', paddingBottom: '5px' }}>Quick Links</h4>
                    <ul style={{ listStyle: 'none', padding: 0, opacity: 0.9 }}>
                        <li style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => onNavigate('home')}>Home</li>
                        <li style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => onNavigate('report')}>Report Incident</li>
                        <li style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => onNavigate('view')}>Live Feed</li>
                        <li style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => onNavigate('admin')}>Admin Login</li>
                    </ul>
                </div>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', opacity: 0.6, fontSize: '0.9rem' }}>
                &copy; {new Date().getFullYear()} JanRaksha Platform. All rights reserved.
            </div>
        </footer>
    </div>
  </div>
  );
};

const Home = () => {
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [focusedIncidentId, setFocusedIncidentId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    // Get User Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              setUserLocation(data.display_name);
            }
          } catch (error) {
            console.error("Geocoding failed", error);
          }
        },
        (error) => console.error("Location access denied", error)
      );
    }

    // Initial Fetch
    const fetchIncidents = async () => {
      try {
        const data = await getIncidents();
        setIncidents(data);
      } catch (error) {
        console.error('Failed to fetch incidents');
      }
    };
    fetchIncidents();

    // Real-time Listeners
    socket.on('incident:new', (newIncident) => {
      setIncidents((prev) => [newIncident, ...prev]);
    });

    socket.on('incident:update', (updatedIncident) => {
      setIncidents((prev) => 
        prev.map((inc) => inc._id === updatedIncident._id ? updatedIncident : inc)
      );
    });

    socket.on('incident:delete', (deletedId) => {
      setIncidents((prev) => prev.filter((inc) => inc._id !== deletedId));
    });

    return () => {
      socket.off('incident:new');
      socket.off('incident:update');
      socket.off('incident:delete');
    };
  }, []);

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return <LandingPage onNavigate={setActiveTab} userLocation={userLocation} incidents={incidents} />;
      case 'report':
        return (
          <div className="container">
            <h2 style={{marginBottom: '20px'}}>Report an Incident</h2>
            <div className="grid">
                <IncidentForm />
                <div className="card" style={{padding: 0, overflow: 'hidden', height: 'fit-content'}}>
                    <h3 style={{padding: '15px', margin: 0, borderBottom: '1px solid #eee'}}>Current Incidents Map</h3>
                    <MapView incidents={incidents} onMarkerClick={setFocusedIncidentId} />
                </div>
            </div>
          </div>
        );
      case 'view':
        return (
          <div className="container">
            <h2 style={{marginBottom: '20px'}}>Live Incident Feed</h2>
            <div className="grid">
                <div style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
                    <MapView incidents={incidents} onMarkerClick={setFocusedIncidentId} />
                </div>
                <div>
                    <IncidentList 
                        incidents={incidents} 
                        focusedIncidentId={focusedIncidentId}
                        setFocusedIncidentId={setFocusedIncidentId}
                    />
                </div>
            </div>
          </div>
        );
      case 'admin':
        return (
            <div className="container">
                {!user ? (
                    <div style={{ maxWidth: '500px', margin: '40px auto' }}>
                        <AuthForm onLogin={(userData) => setUser(userData)} />
                    </div>
                ) : (
                    <AdminPanel incidents={incidents} />
                )}
            </div>
        );
      default:
        return <LandingPage onNavigate={setActiveTab} userLocation={userLocation} incidents={incidents} />;
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        setUser={setUser} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
      />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Home;
