import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import './Password.css';
import { API_URL as apiUrl } from '../../config/api';

const Password: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const validatePassword = (pass: string) => {
        if (pass.length < 8) {
            return "Password must be at least 8 characters long";
        }
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const passError = validatePassword(password);
        if (passError) {
            setError(passError);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        const signupData = JSON.parse(localStorage.getItem("signupData") || "{}");

        try {
            const res = await fetch(`${apiUrl}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...signupData,
                    password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || "Failed to set password");
            } else {
                localStorage.removeItem("signupData");
                localStorage.setItem("token", data.token); // Store JWT Token!
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/profilepic");
            }
        } catch (err) {
            setError("Connection error to server");
        }
    };

    return (
        <div className="password-page auth-card-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Secure Your Account</h2>
                    <p>Create a strong password to continue</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>New Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Confirm Password</label>
                        <div className="password-input-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {error && <span className="error-text">{error}</span>}

                    <button type="submit" className="auth-submit-btn">Signup</button>
                </form>
            </div>
        </div>
    );
};

export default Password;
