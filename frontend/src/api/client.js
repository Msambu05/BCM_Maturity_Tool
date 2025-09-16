import axios from 'axios';
const client = axios.create({ baseURL: '' }); // CRA proxy used
client.interceptors.request.use((config) => {
  const access = localStorage.getItem('access');
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});
export default client;