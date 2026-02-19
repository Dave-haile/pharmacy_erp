import axios from "axios";
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
// const API_BASE_URL = "http://localhost:5173";
 
const api = axios.create({
  baseURL: "http://localhost:5173",
  withCredentials: true, // important for sending cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
