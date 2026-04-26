import React, { useState } from 'react';
import './Signup.css';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import type { TokenResponse } from '@react-oauth/google';

const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

interface SignupData {
  user: any;
  detail?: string;
}

const Signup: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phonenumber, setPhoneNumber] = useState<string>('');
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      try {
        const res = await fetch(`${apiUrl}/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenResponse.access_token }),
        });
        const text = await res.text();
        let data: SignupData = { user: null };
        try {
          data = text ? JSON.parse(text) : {};
        } catch (jsonErr) {
          console.error("Google Auth non-JSON response:", text);
          throw new Error("Invalid response from server");
        }
        if (res.ok) {
          alert("Google Signup successful! 🚀");
          localStorage.setItem("user", JSON.stringify(data.user));
          navigate("/dashboard");
        } else {
          alert(data.detail || "Google authentication failed");
        }
      } catch (err: any) {
        console.error("Google Auth Error:", err);
        alert("Failed to connect to backend");
      }
    },
    onError: () => alert("Google Signup Failed"),
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phonenumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Signup failed");
      } else {
        alert("Account created successfully! 🎉");
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/login");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  return (
    <div className="auth-card-wrapper">
      <div className="auth-card horizontal-layout">
        <div className="login-left">
          <img src="tasting-curry.gif" className="side-gif" />
        </div>
        <div className="auth-content-wrapper">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Join FoodsFolio and start your culinary journey</p>
          </div>
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Phone Number</label>
              <input type="number" placeholder="xxxxxxxxxx" value={phonenumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            </div>
            <button type="submit" className="auth-submit-btn">Sign Up</button>
          </form>
          <div className="divider"><span>OR</span></div>
          <div className="social-login-container">
            <button className="social-btn google" onClick={() => login()} title="Sign up with Google">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </button>
            <button className="social-btn apple" onClick={() => alert("Apple Signup coming soon!")} title="Sign up with Apple">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.08-.46-2.07-.48-3.2 0-1.44.62-2.2.44-3.04-.35C3.25 15.82 3.65 8.94 8.54 8.7c1.23.06 2.11.75 2.86.75.7 0 1.9-.84 3.33-.7 1.12.06 4.14.47 5.06 4.34-2.52 1.34-2.12 5.16.51 6.33-.51 1.37-1.3 2.84-2.25 3.86zM14.65 3.62c.57-.73.96-1.74.83-2.73-.87.04-1.92.59-2.54 1.32-.56.64-.99 1.67-.83 2.62.97.08 2-.51 2.54-1.21z" />
              </svg>
            </button>
            <button className="social-btn facebook" onClick={() => alert("Facebook Signup coming soon!")} title="Sign up with Facebook">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
          </div>
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="switch-link">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;