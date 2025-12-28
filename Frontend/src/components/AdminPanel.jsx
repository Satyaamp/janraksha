import React, { useState, useEffect } from 'react';
import { updateIncidentStatus, deleteIncident, addIncidentNote } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminPanel = ({ incidents }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewIncident, setViewIncident] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState('newest');
  const [statsDateRange, setStatsDateRange] = useState('All');
  const [newNote, setNewNote] = useState('');
  const itemsPerPage = 5;

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSeverity = filterSeverity === 'All' || inc.severity === filterSeverity;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      inc.description.toLowerCase().includes(query) || 
      inc.address.toLowerCase().includes(query);
    return matchesSeverity && matchesSearch;
  }).sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIncidents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  // Filter incidents for stats
  const statsIncidents = incidents.filter(inc => {
    if (statsDateRange === 'All') return true;
    const created = new Date(inc.createdAt);
    const now = new Date();
    const diffMs = now - created;
    if (statsDateRange === '24h') return diffMs <= 24 * 60 * 60 * 1000;
    if (statsDateRange === '7d') return diffMs <= 7 * 24 * 60 * 60 * 1000;
    if (statsDateRange === '30d') return diffMs <= 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  // Calculate Severity Stats
  const stats = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0
  };

  statsIncidents.forEach(inc => {
    if (stats[inc.severity] !== undefined) {
      stats[inc.severity]++;
    }
  });

  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: '# of Incidents',
        data: [stats.Critical, stats.High, stats.Medium, stats.Low],
        backgroundColor: ['#d00000', '#e63946', '#e9c46a', '#2a9d8f'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  // Calculate Incidents Per Day
  const incidentsPerDay = {};
  statsIncidents.forEach(inc => {
    const date = new Date(inc.createdAt).toLocaleDateString();
    incidentsPerDay[date] = (incidentsPerDay[date] || 0) + 1;
  });

  const sortedDates = Object.keys(incidentsPerDay).sort((a, b) => new Date(a) - new Date(b));

  const barChartData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Incidents per Day',
        data: sortedDates.map(date => incidentsPerDay[date]),
        backgroundColor: '#457b9d',
      },
    ],
  };

  const downloadCSV = () => {
    const headers = ["Type", "Description", "Address", "Severity", "Status", "Date"];
    const rows = filteredIncidents.map(incident => [
      incident.type === 'Other' && incident.customType ? `Other / ${incident.customType}` : incident.type,
      `"${incident.description.replace(/"/g, '""')}"`,
      `"${incident.address.replace(/"/g, '""')}"`,
      incident.severity,
      incident.status,
      new Date(incident.createdAt).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "admin_incidents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateIncidentStatus(id, newStatus);
      showToast(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      try {
        await deleteIncident(confirmDeleteId);
        showToast('Incident deleted successfully');
      } catch (error) {
        console.error('Error deleting incident', error);
      } finally {
        setConfirmDeleteId(null);
      }
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      const updatedIncident = await addIncidentNote(viewIncident._id, newNote);
      setViewIncident(updatedIncident); // Update local modal state
      setNewNote('');
      showToast('Note added successfully');
    } catch (error) {
      console.error('Error adding note', error);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>Dashboard Overview</h3>
        <select 
          value={statsDateRange} 
          onChange={(e) => setStatsDateRange(e.target.value)}
          style={{ width: 'auto', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="All">All Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card stat-critical">
          <h3>{stats.Critical}</h3>
          <p>Critical</p>
        </div>
        <div className="stat-card stat-high">
          <h3>{stats.High}</h3>
          <p>High</p>
        </div>
        <div className="stat-card stat-medium">
          <h3>{stats.Medium}</h3>
          <p>Medium</p>
        </div>
        <div className="stat-card stat-low">
          <h3>{stats.Low}</h3>
          <p>Low</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', marginBottom: '30px' }}>
        <div style={{ maxWidth: '300px', width: '100%' }}>
          <Pie data={chartData} />
        </div>
        <div style={{ maxWidth: '500px', width: '100%' }}>
          <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Incidents Over Time' } } }} />
        </div>
      </div>

      <div className="admin-controls">
        <h2 style={{ margin: 0 }}>Admin Control</h2>
        <input 
          type="text" 
          placeholder="Search address or description..." 
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          style={{ flex: 1, minWidth: '150px', padding: '5px' }}
        />
        <select 
          value={filterSeverity} 
          onChange={(e) => { setFilterSeverity(e.target.value); setCurrentPage(1); }}
          style={{ width: 'auto', padding: '5px' }}
        >
          <option value="All">All Severities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>
        <select 
          value={sortOrder} 
          onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
          style={{ width: 'auto', padding: '5px' }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button 
          onClick={downloadCSV}
          style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#457b9d', color: 'white', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </button>
      </div>
      <div className="table-responsive">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Type</th>
            <th>Location</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No incidents found.</td>
            </tr>
          ) : (
            currentItems.map((inc) => (
            <tr key={inc._id}>
              <td>
                {inc.imageUrl && (
                  <img 
                    src={`http://localhost:5000${inc.imageUrl}`} 
                    alt="Evidence" 
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => setSelectedImage(`http://localhost:5000${inc.imageUrl}`)}
                  />
                )}
              </td>
              <td>{inc.type === 'Other' && inc.customType ? `Other / ${inc.customType}` : inc.type}</td>
              <td>{inc.address}</td>
              <td>{inc.severity}</td>
              <td>
                <span className={`status-${inc.status.toLowerCase()}`}>
                  {inc.status}
                </span>
              </td>
              <td>
                <button onClick={() => setViewIncident(inc)} style={{ marginRight: '10px', background: '#457b9d', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  View
                </button>
                {inc.status === 'Pending' && (
                  <button onClick={() => handleStatusChange(inc._id, 'Verified')} className="btn-verify" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Verify
                  </button>
                )}
                {inc.status === 'Verified' && (
                  <button onClick={() => handleStatusChange(inc._id, 'Resolved')} className="btn-resolve" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Resolve
                  </button>
                )}
                {inc.status === 'Resolved' && (
                  <>
                    <span style={{ color: '#276749', display: 'inline-flex', alignItems: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <button onClick={() => setConfirmDeleteId(inc._id)} style={{ marginLeft: '10px', background: '#e53e3e', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))
          )}
        </tbody>
      </table>
      </div>

      {/* Pagination Controls */}
      {filteredIncidents.length > itemsPerPage && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            Prev
          </button>
          <span style={{ alignSelf: 'center' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ padding: '5px 10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedImage(null)}
        >
          <img src={selectedImage} alt="Evidence Full" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }} />
        </div>
      )}

      {/* View Incident Detail Modal */}
      {viewIncident && (
        <div className="modal-overlay" onClick={() => setViewIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>Incident Details</h3>
              <button onClick={() => setViewIncident(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '5px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '24px', height: '24px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.85em', color: '#666' }}>Type</label>
                <div style={{ fontWeight: 'bold' }}>{viewIncident.type === 'Other' && viewIncident.customType ? `Other / ${viewIncident.customType}` : viewIncident.type}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.85em', color: '#666' }}>Severity</label>
                <div style={{ fontWeight: 'bold' }}>{viewIncident.severity}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.85em', color: '#666' }}>Status</label>
                <div>
                  <span className={`status-${viewIncident.status.toLowerCase()}`}>
                    {viewIncident.status}
                  </span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85em', color: '#666' }}>Date</label>
                <div style={{ fontSize: '0.9em' }}>{new Date(viewIncident.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85em', color: '#666' }}>Location</label>
              <div style={{ fontWeight: 'bold' }}>{viewIncident.address}</div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85em', color: '#666' }}>Description</label>
              <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '4px', marginTop: '5px' }}>
                {viewIncident.description}
              </div>
            </div>

            {viewIncident.imageUrl && (
              <div>
                <label style={{ fontSize: '0.85em', color: '#666', display: 'block', marginBottom: '5px' }}>Evidence</label>
                <img 
                  src={`http://localhost:5000${viewIncident.imageUrl}`} 
                  alt="Evidence" 
                  style={{ width: '100%', borderRadius: '8px', cursor: 'pointer', border: '1px solid #ddd' }}
                  onClick={() => setSelectedImage(`http://localhost:5000${viewIncident.imageUrl}`)}
                />
                <div style={{ fontSize: '0.8em', color: '#999', marginTop: '5px', textAlign: 'center' }}>Click image to enlarge</div>
              </div>
            )}

            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Internal Notes</h4>
              <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#f9f9f9', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                {viewIncident.notes && viewIncident.notes.length > 0 ? (
                  viewIncident.notes.map((note, index) => (
                    <div key={index} style={{ marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                      <div style={{ fontSize: '0.9em' }}>{note.text}</div>
                      <div style={{ fontSize: '0.75em', color: '#888' }}>{new Date(note.createdAt).toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#888', fontStyle: 'italic' }}>No notes added yet.</div>
                )}
              </div>
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={newNote} 
                  onChange={(e) => setNewNote(e.target.value)} 
                  placeholder="Add an internal note..." 
                  style={{ flex: 1 }}
                />
                <button type="submit" style={{ background: '#457b9d', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer' }}>Add</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
            <p>Are you sure you want to delete this incident? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ background: '#ccc', color: '#333', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDelete} style={{ background: '#e53e3e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
