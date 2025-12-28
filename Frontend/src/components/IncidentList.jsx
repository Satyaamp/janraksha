import React, { useState, useEffect } from 'react';

const IncidentList = ({ incidents, focusedIncidentId, setFocusedIncidentId }) => {
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterDistance, setFilterDistance] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  useEffect(() => {
    if (!userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            if (filterDistance !== 'All') {
              alert("Unable to retrieve your location. Please enable location services.");
              setFilterDistance('All');
            }
          }
        );
      } else if (filterDistance !== 'All') {
        alert("Geolocation is not supported by this browser.");
        setFilterDistance('All');
      }
    }
  }, [filterDistance, userLocation]);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSeverity = filterSeverity === 'All' || inc.severity === filterSeverity;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      inc.description.toLowerCase().includes(query) || 
      inc.address.toLowerCase().includes(query);
    
    let matchesDistance = true;
    if (filterDistance !== 'All' && userLocation && inc.latitude && inc.longitude) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        inc.latitude,
        inc.longitude
      );
      matchesDistance = distance <= parseInt(filterDistance);
    }

    return matchesSeverity && matchesSearch && matchesDistance;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIncidents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  useEffect(() => {
    if (focusedIncidentId) {
      const index = filteredIncidents.findIndex(inc => inc._id === focusedIncidentId);
      
      // If filtered out, reset filters to find it
      if (index === -1 && (filterSeverity !== 'All' || searchQuery !== '')) {
        setFilterSeverity('All');
        setSearchQuery('');
        return;
      }

      if (index !== -1) {
        const page = Math.ceil((index + 1) / itemsPerPage);
        if (page !== currentPage) {
          setCurrentPage(page);
        }
        
        setTimeout(() => {
          const element = document.getElementById(`incident-${focusedIncidentId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.animation = 'none';
            element.offsetHeight; /* trigger reflow */
            element.style.animation = 'highlight 2s';
          }
          if (setFocusedIncidentId) setFocusedIncidentId(null);
        }, 100);
      }
    }
  }, [focusedIncidentId, filteredIncidents, itemsPerPage, currentPage, filterSeverity, searchQuery, setFocusedIncidentId]);

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
    link.setAttribute("download", "incidents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async (incident) => {
    const shareData = {
      title: `Incident Report: ${incident.type}`,
      text: `🚨 ${incident.type} reported at ${incident.address}.\nSeverity: ${incident.severity}\nStatus: ${incident.status}\n\nView more on ResQ Platform.`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('Incident details copied to clipboard!');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>Live Feed</h2>
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
          value={filterDistance} 
          onChange={(e) => { setFilterDistance(e.target.value); setCurrentPage(1); }}
          style={{ width: 'auto', padding: '5px' }}
        >
          <option value="All">Any Distance</option>
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="25">Within 25 km</option>
          <option value="50">Within 50 km</option>
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
      <div className="list-container">
        {currentItems.length === 0 ? (
          <p>No active incidents matching filter.</p>
        ) : (
          currentItems.map((incident) => {
            const distance = (userLocation && incident.latitude && incident.longitude) 
              ? calculateDistance(userLocation.latitude, userLocation.longitude, incident.latitude, incident.longitude).toFixed(1) 
              : null;

            return (
            <div key={incident._id} id={`incident-${incident._id}`} className={`incident-item severity-${incident.severity.toLowerCase()}`}>
              <div className="incident-header">
                <span className="badge">{incident.type === 'Other' && incident.customType ? `Other: ${incident.customType}` : incident.type}</span>
                <span className="time" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '14px', height: '14px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {new Date(incident.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p style={{ display: 'flex', alignItems: 'start', gap: '6px', marginTop: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>
                  <strong>Location:</strong> {incident.address}
                  {distance && <span style={{ marginLeft: '5px', color: '#666', fontSize: '0.9em' }}>({distance} km)</span>}
                </span>
              </p>
              <p>{incident.description}</p>
              {incident.imageUrl && (
                <img 
                  src={`http://localhost:5000${incident.imageUrl}`} 
                  alt="Incident" 
                  style={{ width: '100%', maxWidth: '300px', marginTop: '10px', borderRadius: '4px' }} 
                />
              )}
              {incident.notes && incident.notes.length > 0 && (
                <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '10px', borderRadius: '4px', marginTop: '10px', fontSize: '0.9em', border: '1px solid #ffeeba' }}>
                  <strong>Latest Update:</strong> {incident.notes[incident.notes.length - 1].text}
                </div>
              )}
              <div className="status-indicator" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Status: <span className={`status-${incident.status.toLowerCase()}`}>{incident.status}</span></span>
                <button 
                  onClick={() => handleShare(incident)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#457b9d', display: 'flex', alignItems: 'center', gap: '5px', padding: '5px' }}
                  title="Share Incident"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          );
          })
        )}
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
    </div>
  );
};

export default IncidentList;
