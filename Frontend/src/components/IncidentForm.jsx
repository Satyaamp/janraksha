import React, { useState } from 'react';
import { createIncident } from '../services/api';

const IncidentForm = () => {
  const [formData, setFormData] = useState({
    type: 'Fire',
    customType: '',
    description: '',
    address: '',
    latitude: '',
    longitude: '',
    severity: 'Medium'
  });
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const data = new FormData();
    data.append('type', formData.type);
    data.append('customType', formData.customType);
    data.append('description', formData.description);
    data.append('address', formData.address);
    data.append('latitude', formData.latitude);
    data.append('longitude', formData.longitude);
    data.append('severity', formData.severity);
    if (image) {
      data.append('image', image);
    }

    try {
      await createIncident(data);
      setFormData({ type: 'Fire', customType: '', description: '', address: '', latitude: '', longitude: '', severity: 'Medium' });
      setImage(null);
      alert('Incident Reported Successfully!');
    } catch (error) {
      console.error('Error reporting incident', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let locationString = `${latitude}, ${longitude}`;

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              locationString = data.display_name;
            }
          } catch (error) {
            console.error("Geocoding failed, using coordinates", error);
          }

          setFormData((prev) => ({ ...prev, address: locationString, latitude, longitude }));
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  return (
    <div className="card">
      <h2>Report Incident</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type</label>
          <select 
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option>Fire</option>
            <option>Medical</option>
            <option>Police</option>
            <option>Accident</option>
            <option>Other</option>
          </select>
        </div>
        {formData.type === 'Other' && (
          <div className="form-group">
            <label>Specify Type</label>
            <input
              type="text"
              value={formData.customType}
              onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
              placeholder="Enter incident type"
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Location</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              required 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Text address or GPS coordinates"
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              onClick={getCurrentLocation}
              style={{ background: '#457b9d', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Get Current GPS Location"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Severity</label>
          <select 
            value={formData.severity} 
            onChange={(e) => setFormData({...formData, severity: e.target.value})}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea 
            required
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Attach Image (Optional)</label>
          <input 
            type="file" 
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner"></span> Sending...
            </>
          ) : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

export default IncidentForm;
