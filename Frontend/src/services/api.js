import axios from 'axios';

// Change this URL if deploying
const API_URL = 'https://janraksha.onrender.com/api/incidents';
const AUTH_URL = 'https://janraksha.onrender.com/api/auth';

export const getIncidents = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createIncident = async (incidentData) => {
  const response = await axios.post(API_URL, incidentData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateIncidentStatus = async (id, status) => {
  const response = await axios.put(`${API_URL}/${id}`, { status });
  return response.data;
};

export const deleteIncident = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

export const addIncidentNote = async (id, text) => {
  const response = await axios.post(`${API_URL}/${id}/notes`, { text });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axios.post(`${AUTH_URL}/register`, userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await axios.post(`${AUTH_URL}/login`, userData);
  return response.data;
};
