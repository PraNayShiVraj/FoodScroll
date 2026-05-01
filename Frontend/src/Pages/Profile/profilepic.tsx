import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UploadCloud, Loader2 } from 'lucide-react';
import './profilepic.css';

const ProfilePic: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setFileToUpload(file);
    }
  };

  const handleNext = async () => {
    if (!fileToUpload) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(`/profile/${user.username || ''}`);
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePic', fileToUpload);

      const token = localStorage.getItem('token');
      
      const res = await fetch('http://localhost:3000/upload-profile-pic', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error("Upload failed. Make sure Cloudinary credentials are set in the backend!");
      }

      const data = await res.json();
      
      // Update local storage user data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
         let parsed = JSON.parse(storedUser);
         parsed.profilePic = data.profilePic;
         localStorage.setItem('user', JSON.stringify(parsed));
      }

      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(`/profile/${updatedUser.username || ''}`);
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="pic-setup-container">
      <div className="pic-setup-card">
        <div className="pic-header">
          <h2>Add Profile Photo</h2>
          <p>Add a photo so your friends know it's you.</p>
        </div>

        <div className="pic-preview-section">
          {selectedImage ? (
            <div className="pic-preview">
              <img src={selectedImage} alt="Profile Preview" />
            </div>
          ) : (
            <div className="pic-placeholder">
              <User size={80} color="#737373" />
            </div>
          )}

          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: 'none' }} 
          />
        </div>

        <div className="pic-actions">
          {!selectedImage ? (
             <>
               <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
                 <UploadCloud size={20} style={{ marginRight: '8px' }} />
                 Select from device
               </button>
               <button className="btn-skip" onClick={handleNext}>
                 Skip for now
               </button>
             </>
          ) : (
             <>
               <button className="btn-upload" onClick={handleNext} disabled={isUploading}>
                 {isUploading ? <Loader2 size={20} className="animate-spin" /> : "Save Profile Photo"}
               </button>
               {!isUploading && (
                  <button className="btn-skip" onClick={() => { setSelectedImage(null); setFileToUpload(null); }}>
                    Choose a different photo
                  </button>
               )}
             </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePic;