import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Grid, Clapperboard, Heart, MessageCircle } from 'lucide-react';
import { API_URL as apiUrl } from '../../config/api';
import './profile.css';

const SavedItems: React.FC = () => {
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${apiUrl}/api/interactions/saved`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSavedItems(data.savedItems || []);
        } else {
          console.error("Failed to fetch saved items");
        }
      } catch (err) {
        console.error("Error fetching saved items:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavedItems();
  }, [navigate]);

  return (
    <div className="profile-page-container" style={{ paddingTop: '20px' }}>
      <div className="profile-content-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 style={{ color: 'white', margin: 0 }}>Saved Content</h1>
        </div>

        {isLoading ? (
          <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Saved Items...</div>
        ) : savedItems.length > 0 ? (
          <div className="profile-grid">
            {savedItems.map((item: any, idx: number) => (
              <div
                key={item._id || idx}
                className="grid-item"
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                {item.contentType === 'post' ? (
                  <img src={item.url} alt="saved post" className="grid-item-img" style={{ aspectRatio: '1/1', objectFit: 'cover' }} />
                ) : (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <video src={item.url} className="grid-item-img" style={{ aspectRatio: '9/16', objectFit: 'cover' }} />
                    <Clapperboard size={20} color="white" style={{ position: 'absolute', top: '10px', right: '10px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                  </div>
                )}

                <div className="grid-item-overlay">
                  <div className="overlay-stat">
                    <Heart size={20} className="fill-white" /> <span>{item.likes?.length || 0}</span>
                  </div>
                  <div className="overlay-stat">
                    <MessageCircle size={20} className="fill-white" /> <span>{item.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
            No saved items yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedItems;
