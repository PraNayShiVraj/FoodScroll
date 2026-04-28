import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VerifyOtp.css";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";

const VerifyOtp: React.FC = () => {
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();

    const handleVerify = async () => {
        const signupData = JSON.parse(localStorage.getItem("signupData") || "{}");

        try {
            const res = await fetch(`${apiUrl}/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...signupData,
                    otp,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.detail || "Invalid OTP");
            } else {
                // Don't remove signupData yet, we need it for password step
                navigate("/password");
            }
        } catch (err) {
            alert("Verification failed");
        }
    };

    return (
        <div className="verify-otp-page auth-card-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Verify OTP</h2>
                    <p>Enter the 6-digit code sent to your email</p>
                </div>

                <div className="auth-form">
                    <div className="input-group">
                        <label>One-Time Password</label>
                        <input
                            type="text"
                            placeholder="X X X X X X"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength={6}
                        />
                    </div>

                    <button className="auth-submit-btn" onClick={handleVerify}>Continue</button>
                </div>

                <div className="auth-footer">
                    <p>Didn't receive the code? <button className="switch-btn" onClick={() => alert("Resending OTP...")}>Resend</button></p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOtp;