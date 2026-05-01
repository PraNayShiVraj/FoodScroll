import React, { useState } from 'react';
import { Grid, RefreshCcw, Settings, Heart, MessageCircle, Eye, EyeOff } from 'lucide-react';
import './profile.css';
import { useParams } from 'react-router-dom';

interface FoodPost {
  id: number;
  imageUrl: string;
  type: 'post' | 'reel';
  likes: number;
  comments: number;
}

const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:3000";

const FoodProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');

  const foodContent: FoodPost[] = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    imageUrl: `https://picsum.photos/seed/${i + 60}/500/500`,
    type: i % 3 === 0 ? 'reel' : 'post',
    likes: Math.floor(Math.random() * 500) + 50,
    comments: Math.floor(Math.random() * 50) + 5,
  }));

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const { username } = useParams();

  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);

  React.useEffect(() => {
    const fetchProfile = async () => {
      setIsProfileLoading(true);
      setProfileNotFound(false);
      try {
        const response = await fetch(`${apiUrl}/api/profile/${username}`);
        if (!response.ok) {
          setProfileNotFound(true);
        } else {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setProfileNotFound(true);
      }
      setIsProfileLoading(false);
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const isOwnProfile = loggedInUser.username === username;

  const profileImage = profileData?.profilePic && profileData.profilePic !== ""
    ? profileData.profilePic
    : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&h=300"; // Default image

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(loggedInUser.username || '');
  const [editBio, setEditBio] = useState(loggedInUser.bio || '');
  const [editProfilePic, setEditProfilePic] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(loggedInUser.profilePic || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&h=300");
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [copySuccess, setCopySuccess] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsStep, setSettingsStep] = useState<'menu' | 'otp' | 'view_account'>('menu');
  const [settingsOtp, setSettingsOtp] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [showSettingsPassword, setShowSettingsPassword] = useState(false);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return null;
    if (pass.length < 8) return { label: 'Weak', color: '#ff4d4d' };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) return { label: 'Strong', color: '#4CAF50' };
    return { label: 'Medium', color: '#fbbf24' };
  };

  const handleOtpBoxChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtpArr = settingsOtp.padEnd(6, ' ').split('');
    newOtpArr[index] = value ? value.slice(-1) : ' ';
    const newOtpString = newOtpArr.join('').trim();
    setSettingsOtp(newOtpString);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !settingsOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleSendOtpAuth = async () => {
    setIsSettingsLoading(true);
    setSettingsError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/send-otp-auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        setSettingsError(data.detail || 'Failed to send OTP');
      } else {
        setOtpSentMsg(data.message);
        setSettingsStep('otp');
      }
    } catch (err) {
      setSettingsError('Network error');
    }
    setIsSettingsLoading(false);
  };

  const handleUpdateCredentials = async () => {
    setIsSettingsLoading(true);
    setSettingsError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/update-credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: settingsOtp, newPassword: settingsNewPassword })
      });
      const data = await response.json();
      if (!response.ok) {
        setSettingsError(data.detail || 'Failed to update credentials');
      } else {
        alert('Password updated successfully!');
        setIsSettingsOpen(false);
        setSettingsStep('menu');
        setSettingsOtp('');
        setSettingsNewPassword('');
      }
    } catch (err) {
      setSettingsError('Network error');
    }
    setIsSettingsLoading(false);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('username', editUsername);
      formData.append('bio', editBio);
      if (editProfilePic) {
        formData.append('profilePic', editProfilePic);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.detail || 'Failed to update profile');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      setErrorMsg('Network error. Please try again later.');
    }
    setIsLoading(false);
  };

  if (isProfileLoading) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Profile...</div>;
  }

  if (profileNotFound) {
    return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>User not found.</div>;
  }

  return (
    <div className="profile-page-container">
      <div className="profile-content-wrapper">

        {/* --- Profile Header --- */}
        <header className="profile-header">
          {/* Profile Picture */}
          <div className="profile-avatar-wrapper">
            <img
              src={profileImage}
              alt="Profile"
              className="profile-avatar-img"
            />
          </div>

          {/* Name & Subtitle */}
          <div className="profile-title-container">
            <h1 className="profile-name">{profileData?.username ? `${profileData.username}` : `@${username}`}</h1>
            {isOwnProfile && (
              <Settings
                className="settings-icon-header"
                size={24}
                onClick={() => { setIsSettingsOpen(true); setSettingsStep('menu'); setSettingsError(''); }}
              />
            )}
          </div>
          <p className="profile-subtitle">{profileData?.name || 'User Name'}</p>

          {/* Stats Box */}
          <div className="profile-stats-box">
            <div className="stat-item">
              <strong>124</strong>
              <span>POSTS</span>
            </div>
            <div className="stat-item">
              <strong>12.5k</strong>
              <span>FOLLOWERS</span>
            </div>
            <div className="stat-item">
              <strong>842</strong>
              <span>FOLLOWING</span>
            </div>
          </div>

          {/* Bio */}
          <div className="profile-bio">
            <p className="bio-text">{profileData?.bio || 'Curating the world\'s most vibrant flavors through high-definition visual storytelling. Focused on street food culture and modern fusion. 🌮✨'}</p>
          </div>

          {/* Action Buttons */}
          <div className="profile-action-buttons">
            {isOwnProfile ? (
              <button className="btn-primary" onClick={() => setIsEditing(true)}>EDIT PROFILE</button>
            ) : (
              <button className="btn-primary">FOLLOW</button>
            )}
            <button className="btn-dark" onClick={handleShare}>
              {copySuccess ? 'COPIED!' : 'SHARE'}
            </button>
          </div>
        </header>

        {/* --- Navigation Tabs --- */}
        <div className="profile-tabs">
          <button
            onClick={() => setActiveTab('posts')}
            className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          >
            <Grid size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`tab-btn ${activeTab === 'reels' ? 'active' : ''}`}
          >
            <RefreshCcw size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* --- Content Grid --- */}
        <div className="profile-grid">
          {foodContent.map((item) => (
            <div
              key={item.id}
              className="grid-item"
            >
              <img src={item.imageUrl} alt="content" className="grid-item-img" />

              {/* Overlay on Hover */}
              <div className="grid-item-overlay">
                <div className="overlay-stat">
                  <Heart size={20} className="fill-white" /> <span>{item.likes}</span>
                </div>
                <div className="overlay-stat">
                  <MessageCircle size={20} className="fill-white" /> <span>{item.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {isEditing && (
        <div className="edit-profile-modal-overlay">
          <div className="edit-profile-modal">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)}>×</button>
            </div>

            <div className="modal-body">
              {errorMsg && <div className="error-message">{errorMsg}</div>}

              <div className="edit-pic-section">
                <img src={previewImage || profileImage} alt="Preview" className="edit-preview-img" />
                <label htmlFor="profile-pic-upload" className="upload-btn">
                  Change Photo
                </label>
                <input
                  id="profile-pic-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditProfilePic(e.target.files[0]);
                      setPreviewImage(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                />
              </div>

              <div className="edit-field">
                <label>Username</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="edit-input"
                />
              </div>

              <div className="edit-field">
                <label>Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="edit-input"
                  rows={3}
                />
              </div>
            </div>

            <div className="edit-actions">
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleSaveProfile} className="save-btn" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="edit-profile-modal-overlay">
          <div className="edit-profile-modal settings-modal">
            <div className="modal-header settings-custom-header">
              <h2>Settings</h2>
              <button className="close-btn" onClick={() => setIsSettingsOpen(false)}>×</button>
            </div>

            <div className="modal-body settings-custom-body">
              {settingsError && <div className="error-message">{settingsError}</div>}
              {otpSentMsg && settingsStep === 'otp' && <div className="success-message">{otpSentMsg}</div>}

              {settingsStep === 'menu' && (
                <div className="custom-actions">
                  <button className="custom-back-btn" onClick={() => { setSettingsStep('view_account'); }}>
                    View Account
                  </button>
                  <button className="custom-back-btn" onClick={() => { setSettingsStep('otp'); setOtpSentMsg(''); }}>
                    Change Password
                  </button>
                  <button className="custom-back-btn2" style={{ color: '#ffffffff', borderColor: 'rgba(146, 146, 146, 0.2)' }} onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}

              {settingsStep === 'view_account' && (
                <div className="view-account-container">
                  <div className="view-account-info">
                    <div className="info-row">
                      <span className="info-label">NAME</span>
                      <span className="info-value">{loggedInUser.name || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">USERNAME</span>
                      <span className="info-value">@{loggedInUser.username || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">EMAIL</span>
                      <span className="info-value">{loggedInUser.email || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">PHONE NUMBER</span>
                      <span className="info-value">{loggedInUser.phonenumber || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">MEMBER SINCE</span>
                      <span className="info-value">
                        {loggedInUser.createdAt ? new Date(loggedInUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="custom-actions">
                    <button onClick={() => setSettingsStep('menu')} className="custom-back-btn">Back</button>
                  </div>
                </div>
              )}

              {settingsStep === 'otp' && (
                <div className="settings-otp-form">
                  <div className="edit-field custom-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label className="custom-label">ENTER OTP</label>
                      <button
                        onClick={handleSendOtpAuth}
                        disabled={isSettingsLoading}
                        className="custom-send-otp-btn"
                      >
                        {isSettingsLoading ? 'Sending...' : 'Send OTP'}
                      </button>
                    </div>

                    <div className="otp-boxes-container">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <input
                          key={index}
                          id={`otp-input-${index}`}
                          type="text"
                          maxLength={1}
                          className="otp-box-input"
                          value={settingsOtp[index] && settingsOtp[index] !== ' ' ? settingsOtp[index] : ''}
                          onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="edit-field custom-field" style={{ marginTop: '25px' }}>
                    <label className="custom-label">NEW PASSWORD</label>
                    <div className="password-input-wrapper custom-pass-wrapper">
                      <input
                        type={showSettingsPassword ? "text" : "password"}
                        value={settingsNewPassword}
                        onChange={(e) => setSettingsNewPassword(e.target.value)}
                        className="edit-input custom-pass-input"
                        placeholder="Min. 8 characters"
                      />
                      <button type="button" onClick={() => setShowSettingsPassword(!showSettingsPassword)} className="password-toggle-btn custom-eye-btn">
                        {showSettingsPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {settingsNewPassword && getPasswordStrength(settingsNewPassword) && (
                      <div className="password-strength-indicator" style={{ color: getPasswordStrength(settingsNewPassword)?.color }}>
                        <div className="strength-icon">✓</div>
                        Password strength: {getPasswordStrength(settingsNewPassword)?.label}
                      </div>
                    )}
                  </div>

                  <div className="custom-actions">
                    <button onClick={handleUpdateCredentials} className="custom-update-btn" disabled={isSettingsLoading}>
                      {isSettingsLoading ? 'Updating...' : 'Update Password'}
                    </button>
                    <button onClick={() => setSettingsStep('menu')} className="custom-back-btn">Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FoodProfile;