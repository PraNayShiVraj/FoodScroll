import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from "./Pages/Auth/Login";
import Signup from "./Pages/Auth/Signup";
import VerifyOtp from "./Pages/Auth/VerifyOtp";
import Password from "./Pages/Auth/Password";
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || 'google-client-id-placeholder';

function App() {
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/Login" element={<Login />} />
                        <Route path="/Signup" element={<Signup />} />
                        <Route path="/" element={<Navigate to="/Login" />} />
                        <Route path="/verify-otp" element={<VerifyOtp />} />
                        <Route path="/password" element={<Password />} />
                    </Routes>
                </div>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;

