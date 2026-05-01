import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from "./Pages/Auth/Login";
import Signup from "./Pages/Auth/Signup";
import VerifyOtp from "./Pages/Auth/VerifyOtp";
import Password from "./Pages/Auth/Password";
import FoodProfile from "./Pages/Profile/Profile";
import ProfilePic from "./Pages/Profile/profilepic";

import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || 'google-client-id-placeholder';

const ProfileRedirect = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return <Navigate to="/Login" />;
    try {
        const user = JSON.parse(userStr);
        if (user && user.username) {
            return <Navigate to={`/profile/${user.username}`} replace />;
        }
    } catch (e) {
        return <Navigate to="/Login" />;
    }
    return <Navigate to="/Login" />;
};

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
                        <Route path="/profilepic" element={<ProfilePic />} />
                        <Route path="/profile" element={<ProfileRedirect />} />
                        <Route path="/profile/:username" element={<FoodProfile />} />
                    </Routes>
                </div>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;

