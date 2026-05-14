import React, { useState, useMemo, useRef } from 'react';
import { Grid, Clapperboard, Settings, Heart, MessageCircle, Eye, EyeOff, MoreVertical, Trash2, Bookmark, Share2, Edit3, Plus, X, Volume2, VolumeX } from 'lucide-react';
import './profile.css';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL as apiUrl } from '../../config/api';

/**
 * Checks if the current user is authenticated by verifying
 * that both a JWT token and user data exist in localStorage.
 * 
 * NOTE: This is a UI convenience check only.
 * The REAL security gate is the backend JWT middleware + authorizeOwner.
 * Even if someone manipulates localStorage, the backend will reject
 * unauthorized requests with 401/403.
 */
function getAuthenticatedUser(): { _id: string; username: string;[key: string]: any } | null {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) return null;

    const user = JSON.parse(userStr);
    if (!user || !user._id) return null;

    return user;
  } catch {
    return null;
  }
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const FoodProfile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const navigate = useNavigate();

  const loggedInUser = useMemo(() => getAuthenticatedUser(), []);
  const { id } = useParams();

  // Only true when: (1) user is logged in, (2) has a valid token, (3) _id matches the URL param
  // This is a UI-only check — backend enforces the real authorization
  const isOwnProfile = Boolean(loggedInUser && loggedInUser._id === id);

  const [profileData, setProfileData] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowActionLoading, setIsFollowActionLoading] = useState(false);

  const displayedContent = useMemo(() => {
    if (!profileData) return [];
    return activeTab === 'posts' ? (profileData.posts || []) : (profileData.shorts || []);
  }, [profileData, activeTab]);

  const fetchProfile = async () => {
    setIsProfileLoading(true);
    setProfileNotFound(false);
    try {
      const response = await fetch(`${apiUrl}/api/profile/${id}`);
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

  React.useEffect(() => {
    const fetchFollowStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token || !id || isOwnProfile) return;
      try {
        const res = await fetch(`${apiUrl}/api/is-following/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      } catch (err) {
        console.error("Error checking follow status:", err);
      }
    };

    if (id) {
      fetchProfile();
      fetchFollowStatus();
    }
  }, [id, isOwnProfile]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to follow users");
      navigate('/Login');
      return;
    }

    setIsFollowActionLoading(true);
    const method = isFollowing ? 'DELETE' : 'POST';
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    try {
      const res = await fetch(`${apiUrl}/api/${endpoint}/${id}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        // Refresh profile data to get updated counts
        const response = await fetch(`${apiUrl}/api/profile/${id}`);
        const data = await response.json();
        setProfileData(data);
      }
    } catch (err) {
      console.error("Follow action failed:", err);
    } finally {
      setIsFollowActionLoading(false);
    }
  };



  const profileImage = profileData?.profilePic && profileData.profilePic !== ""
    ? profileData.profilePic
    : "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&h=300"; // Default image

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(loggedInUser?.username || '');
  const [editBio, setEditBio] = useState(loggedInUser?.bio || '');
  const [editProfilePic, setEditProfilePic] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(loggedInUser?.profilePic || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=300&h=300");
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



  const [selectedViewItem, setSelectedViewItem] = useState<any>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Video Control State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Toggle play/pause by clicking video (since button is removed)
  const togglePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Content Editing State
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editIngredients, setEditIngredients] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIsVeg, setEditIsVeg] = useState(true);
  const [currentIng, setCurrentIng] = useState('');
  const [currentT, setCurrentT] = useState('');
  const [isEditLoading, setIsEditLoading] = useState(false);

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setEditCaption(item.caption || '');
    setEditIngredients(item.ingredients || []);
    setEditTags(item.tags || []);
    setEditIsVeg(item.isVeg !== undefined ? item.isVeg : true);
    setIsEditingContent(true);
    setActiveMenuId(null);
  };

  const handleUpdateContent = async () => {
    if (!editingItem) return;
    setIsEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const type = activeTab === 'posts' ? 'posts' : 'shorts';
      const response = await fetch(`${apiUrl}/api/upload/edit-content/${type}/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          caption: editCaption,
          ingredients: editIngredients,
          tags: editTags,
          isVeg: editIsVeg
        })
      });

      if (response.ok) {
        setIsEditingContent(false);
        fetchProfile(); // Refresh
      } else {
        const data = await response.json();
        alert(data.detail || 'Failed to update content');
      }
    } catch (err) {
      console.error('Edit error:', err);
    } finally {
      setIsEditLoading(false);
    }
  };

  // Interaction Handlers
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isInteracting, setIsInteracting] = useState(false);

  const handleInteraction = async (endpoint: string, payload: any) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to perform this action");
      return null;
    }

    try {
      const response = await fetch(`${apiUrl}/api/interactions/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error(`Interaction error (${endpoint}):`, err);
    }
    return null;
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedViewItem || isInteracting) return;
    setIsInteracting(true);

    const type = activeTab === 'posts' ? 'post' : 'short';
    const data = await handleInteraction('like', { contentId: selectedViewItem._id, type });
    
    if (data) {
      // Optimistically update selected view item
      const newLikes = [...(selectedViewItem.likes || [])];
      if (data.liked) {
        newLikes.push(loggedInUser?._id);
      } else {
        const index = newLikes.indexOf(loggedInUser?._id);
        if (index > -1) newLikes.splice(index, 1);
      }
      setSelectedViewItem({ ...selectedViewItem, likes: newLikes });
      fetchProfile(); // background refresh
    }
    setIsInteracting(false);
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedViewItem || isInteracting) return;
    setIsInteracting(true);

    const type = activeTab === 'posts' ? 'post' : 'short';
    const data = await handleInteraction('save', { contentId: selectedViewItem._id, type });
    
    if (data) {
      const newSaves = [...(selectedViewItem.saves || [])];
      if (data.saved) {
        newSaves.push(loggedInUser?._id);
      } else {
        const index = newSaves.indexOf(loggedInUser?._id);
        if (index > -1) newSaves.splice(index, 1);
      }
      setSelectedViewItem({ ...selectedViewItem, saves: newSaves });
    }
    setIsInteracting(false);
  };

  const handleAddComment = async () => {
    if (!selectedViewItem || !newCommentText.trim() || isInteracting) return;
    setIsInteracting(true);

    const type = activeTab === 'posts' ? 'post' : 'short';
    const data = await handleInteraction('comment', { 
      contentId: selectedViewItem._id, 
      type, 
      text: newCommentText 
    });
    
    if (data && data.comment) {
      const newComments = [...(selectedViewItem.comments || []), data.comment];
      setSelectedViewItem({ ...selectedViewItem, comments: newComments });
      setNewCommentText('');
      fetchProfile(); // background refresh
    }
    setIsInteracting(false);
  };


  const handleDeleteContent = async (contentId: string, type: 'posts' | 'shorts') => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'posts' ? 'post' : 'short'}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/upload/delete-content/${type}/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to delete');
      }

      setActiveMenuId(null);
      fetchProfile(); // Refresh the grid
    } catch (err: any) {
      alert(err.message);
    }
  };

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
            <h1 className="profile-name">{profileData?.username ? `${profileData.username}` : `@${id}`}</h1>
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
              <strong>{profileData?.postsCount || 0}</strong>
              <span>POSTS</span>
            </div>
            <div className="stat-item">
              <strong>{profileData?.followersCount || 0}</strong>
              <span>FOLLOWERS</span>
            </div>
            <div className="stat-item">
              <strong>{profileData?.followingCount || 0}</strong>
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
              <button className="btn-primary" onClick={() => { if (isOwnProfile) setIsEditing(true); }}>EDIT PROFILE</button>
            ) : (
              <button
                className={`btn-primary ${isFollowing ? 'btn-unfollow' : ''}`}
                onClick={handleFollowToggle}
                disabled={isFollowActionLoading}
              >
                {isFollowActionLoading ? '...' : (isFollowing ? 'UNFOLLOW' : 'FOLLOW')}
              </button>
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
            <Clapperboard size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* --- Content Grid --- */}
        <div className={`profile-grid ${activeTab === 'reels' ? 'reels-grid' : ''}`}>
          {displayedContent.length > 0 ? (
            displayedContent.map((item: any, idx: number) => (
              <div
                key={item._id || idx}
                className={`grid-item ${activeTab === 'reels' ? 'reel-grid-item' : ''}`}
                onClick={() => setSelectedViewItem(item)}
              >
                {activeTab === 'posts' ? (
                  <img src={item.url} alt="content" className="grid-item-img" />
                ) : (
                  <video src={item.url} className="grid-item-img" />
                )}

                {/* Overlay on Hover */}
                <div className="grid-item-overlay">
                  {isOwnProfile && (
                    <div className="item-options-wrapper" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="item-options-btn"
                        onClick={() => setActiveMenuId(activeMenuId === item._id ? null : item._id)}
                      >
                        <MoreVertical size={20} color="white" />
                      </button>

                      {activeMenuId === item._id && (
                        <div className="item-dropdown">
                          <button
                            className="dropdown-item"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button
                            className="dropdown-item delete"
                            onClick={() => handleDeleteContent(item._id, activeTab === 'posts' ? 'posts' : 'shorts')}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="overlay-stat">
                    <Heart size={20} className="fill-white" /> <span>{item.likes?.length || 0}</span>
                  </div>
                  <div className="overlay-stat">
                    <MessageCircle size={20} className="fill-white" /> <span>{item.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-content-message" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
              No {activeTab} yet.
            </div>
          )}
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
                  <button className="custom-back-btn" onClick={() => navigate('/saved')}>
                    Saved Posts & Reels
                  </button>
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
                      <span className="info-value">{loggedInUser?.name || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">USERNAME</span>
                      <span className="info-value">@{loggedInUser?.username || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">EMAIL</span>
                      <span className="info-value">{loggedInUser?.email || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">PHONE NUMBER</span>
                      <span className="info-value">{loggedInUser?.phonenumber || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">MEMBER SINCE</span>
                      <span className="info-value">
                        {loggedInUser?.createdAt ? new Date(loggedInUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
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



      {isEditingContent && (
        <div className="edit-profile-modal-overlay">
          <div className="edit-profile-modal content-edit-modal">
            <div className="modal-header">
              <h2>Edit {activeTab === 'posts' ? 'Post' : 'Short'}</h2>
              <button className="close-btn" onClick={() => setIsEditingContent(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="edit-field">
                <label>Caption</label>
                <textarea
                  className="edit-input"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="edit-field">
                <label>Ingredients</label>
                <div className="edit-tag-input-wrapper">
                  <input
                    type="text"
                    className="edit-input"
                    value={currentIng}
                    onChange={(e) => setCurrentIng(e.target.value)}
                    placeholder="Add ingredient..."
                  />
                  <button onClick={() => { if (currentIng.trim()) { setEditIngredients([...editIngredients, currentIng.trim()]); setCurrentIng(''); } }}>
                    <Plus size={18} />
                  </button>
                </div>
                <div className="edit-tags-display">
                  {editIngredients.map((ing, i) => (
                    <span key={i} className="edit-tag-item">
                      {ing} <X size={12} onClick={() => setEditIngredients(editIngredients.filter((_, idx) => idx !== i))} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="edit-field">
                <label>Tags</label>
                <div className="edit-tag-input-wrapper">
                  <input
                    type="text"
                    className="edit-input"
                    value={currentT}
                    onChange={(e) => setCurrentT(e.target.value)}
                    placeholder="Add tag..."
                  />
                  <button onClick={() => { if (currentT.trim()) { setEditTags([...editTags, currentT.trim()]); setCurrentT(''); } }}>
                    <Plus size={18} />
                  </button>
                </div>
                <div className="edit-tags-display">
                  {editTags.map((tag, i) => (
                    <span key={i} className="edit-tag-item">
                      #{tag} <X size={12} onClick={() => setEditTags(editTags.filter((_, idx) => idx !== i))} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="edit-field">
                <label>Dietary Type</label>
                <div className="edit-diet-toggle">
                  <button
                    className={`diet-btn veg ${editIsVeg ? 'active' : ''}`}
                    onClick={() => setEditIsVeg(true)}
                  >
                    VEG
                  </button>
                  <button
                    className={`diet-btn non-veg ${!editIsVeg ? 'active' : ''}`}
                    onClick={() => setEditIsVeg(false)}
                  >
                    NON-VEG
                  </button>
                </div>
              </div>
            </div>
            <div className="edit-actions">
              <button onClick={() => setIsEditingContent(false)} className="cancel-btn">Cancel</button>
              <button onClick={handleUpdateContent} className="save-btn" disabled={isEditLoading}>
                {isEditLoading ? 'Updating...' : 'Update Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedViewItem && (
        <div className="edit-profile-modal-overlay" onClick={() => setSelectedViewItem(null)}>
          <div className={`view-content-modal ${showComments ? 'with-comments' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={`view-frame ${activeTab === 'posts' ? 'post' : 'shorts'}`}>
              {activeTab === 'posts' ? (
                <img src={selectedViewItem.url} alt="view" className="preview-media" />
              ) : (
                <video
                  ref={videoRef}
                  src={selectedViewItem.url}
                  className="preview-media"
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onClick={togglePlayClick}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                />
              )}

              {/* Instagram-style Overlay */}
              <div className="ig-style-overlay">
                <div className="overlay-top-actions">
                  <div className="actions-left">
                    {/* Empty or space for other top elements */}
                  </div>
                  <div className="actions-right">
                    {activeTab === 'reels' && (
                      <div className="video-controls-group">
                        <button className="glass-btn" onClick={toggleMute}>
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                      </div>
                    )}
                    <button className="glass-btn"><Share2 size={20} /></button>
                  </div>
                </div>

                <div className="overlay-side-actions">
                  <button className="glass-btn" onClick={handleToggleLike}>
                    <Heart size={24} fill={selectedViewItem.likes?.includes(loggedInUser?._id) ? "#ff3040" : "none"} color={selectedViewItem.likes?.includes(loggedInUser?._id) ? "#ff3040" : "white"} />
                    <span className="action-count">{selectedViewItem.likes?.length || 0}</span>
                  </button>
                  <button className="glass-btn" onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}>
                    <MessageCircle size={24} />
                    <span className="action-count">{selectedViewItem.comments?.length || 0}</span>
                  </button>
                  <button className="glass-btn" onClick={handleToggleSave}>
                    <Bookmark size={24} fill={selectedViewItem.saves?.includes(loggedInUser?._id) ? "white" : "none"} />
                  </button>
                </div>

                <div className="overlay-bottom-section">
                  <div className="overlay-user-info">
                    <div className="user-info-main">
                      <div className="user-avatar-small">
                        <img src={profileImage} alt="User" />
                      </div>
                      <div className="user-text-details">
                        <div className="username-row">
                          <span className="overlay-username">@{profileData?.username || 'user'}</span>
                          <button className="overlay-follow-btn">Follow</button>
                        </div>
                        <div className="pro-creator-tag">
                          PRO CREATOR
                        </div>
                      </div>
                    </div>
                    <div className="overlay-caption">
                      {selectedViewItem.caption || "Exploring the neon heart of Tokyo tonight. The aesthetic here is absolutely..."}
                    </div>
                  </div>

                  {/* Video Timeline / Progress Bar */}
                  {activeTab === 'reels' && (
                    <div className="video-timeline-container" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={handleSeek}
                        className="video-timeline-slider"
                      />
                      <div className="video-time-display">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* View Info Panel - Extended to hold comments */}
            <button className="close-view-btn" onClick={() => setSelectedViewItem(null)}>×</button>

            {/* View Info Panel - Extended to hold comments */}
            <div className={`view-info-overlay ${showComments ? 'show-comments' : ''}`} onClick={(e) => e.stopPropagation()}>
              <div className="view-meta">
                <span className="view-date">
                  {new Date(selectedViewItem.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              {showComments && (
                <div className="comments-panel">
                  <div className="sheet-handle"></div>
                  <div className="comments-header">
                    <h3>Comments</h3>
                    <button className="close-comments-mobile-btn" onClick={() => setShowComments(false)}>
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="comments-list">
                    {selectedViewItem.comments && selectedViewItem.comments.length > 0 ? (
                      selectedViewItem.comments.map((c: any, i: number) => (
                        <div key={i} className="comment-item">
                          <img src={c.user?.profilePic || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&h=150"} alt="user" className="comment-avatar" />
                          <div className="comment-content">
                            <span className="comment-username">@{c.user?.username || 'user'}</span>
                            <span className="comment-text">{c.text}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-comments">No comments yet. Be the first!</div>
                    )}
                  </div>
                  
                  <div className="comment-input-area">
                    <img src={loggedInUser?.profilePic || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&h=150"} alt="user" className="input-avatar" />
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button onClick={handleAddComment} disabled={!newCommentText.trim() || isInteracting}>Post</button>
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