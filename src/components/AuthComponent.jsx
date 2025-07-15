import React, { useState } from "react";
import {
  registerUser,
  loginUser,
} from "../utils/firebase-config";

const AuthComponent = () => {
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState("login"); // 'login' or 'register'

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    role: "user",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await registerUser(
      formData.email,
      formData.password,
      formData.firstName,
      formData.role
    );

    if (result.success) {
      setMessage("Registration successful!");
      setIsError(false);
      setFormData({ email: "", password: "", firstName: "", role: "user" });
    } else {
      setMessage(result.message);
      setIsError(true);
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // You can specify a required role here, or leave it null for any role
    const result = await loginUser(formData.email, formData.password, null);

    if (result.success) {
      setMessage(`Welcome back, ${result.user.firstName}!`);
      setIsError(false);
      setFormData({ email: "", password: "", firstName: "", role: "user" });
    } else {
      setMessage(result.message);
      setIsError(true);
    }
    setLoading(false);
  };


  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveForm("login")}
          style={{
            marginRight: "10px",
            padding: "10px 20px",
            backgroundColor: activeForm === "login" ? "#007bff" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <button
          onClick={() => setActiveForm("register")}
          style={{
            padding: "10px 20px",
            backgroundColor: activeForm === "register" ? "#007bff" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Register
        </button>
      </div>

      {activeForm === "login" && (
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "10px" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      )}

      {activeForm === "register" && (
        <form onSubmit={handleRegister}>
          <h2>Register</h2>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
            />
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      )}

      {message && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            backgroundColor: isError ? "#ffebee" : "#e8f5e8",
            color: isError ? "#c62828" : "#2e7d32",
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
};

export default AuthComponent;
