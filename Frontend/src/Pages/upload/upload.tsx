import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Image as ImageIcon, Film, CheckCircle2, X, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { API_URL as apiUrl } from '../../config/api';
import './upload.css';

const Upload: React.FC = () => {
    const navigate = useNavigate();
    const postInputRef = useRef<HTMLInputElement>(null);
    const shortsInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'post' | 'shorts' | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Multi-step and Metadata state
    const [step, setStep] = useState(1); // 1: Select, 2: Details
    const [caption, setCaption] = useState('');
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [isVeg, setIsVeg] = useState(true);
    
    const [currentIngredient, setCurrentIngredient] = useState('');
    const [currentTag, setCurrentTag] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (!token || !user) {
            navigate('/Login');
        }
    }, [navigate]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'post' | 'shorts') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // --- Validation ---
        if (type === 'post') {
            if (!file.type.startsWith('image/')) {
                alert("Only images are allowed for Posts.");
                if (e.target) e.target.value = '';
                return;
            }
        }

        if (type === 'shorts') {
            if (!file.type.startsWith('video/')) {
                alert("Only videos are allowed for Shorts.");
                if (e.target) e.target.value = '';
                return;
            }

            // Check video duration (max 2 minutes)
            try {
                const duration = await new Promise<number>((resolve, reject) => {
                    const video = document.createElement('video');
                    video.preload = 'metadata';

                    const timeout = setTimeout(() => {
                        window.URL.revokeObjectURL(video.src);
                        reject("Video metadata took too long to load.");
                    }, 5000);

                    video.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        window.URL.revokeObjectURL(video.src);
                        resolve(video.duration);
                    };
                    video.onerror = () => {
                        clearTimeout(timeout);
                        reject("Failed to load video metadata (unsupported format?)");
                    };
                    video.src = URL.createObjectURL(file);
                });

                if (duration > 120) {
                    alert("Videos for Shorts must be 2 minutes or less.");
                    if (e.target) e.target.value = '';
                    return;
                }
            } catch (err: any) {
                console.error("Video Validation Error:", err);
                alert(err || "Could not verify video duration.");
                if (e.target) e.target.value = '';
                return;
            }
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setPreviewType(type);
        setStep(1); // Ensure we are on step 1
    };

    const handleAddIngredient = () => {
        if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
            setIngredients([...ingredients, currentIngredient.trim()]);
            setCurrentIngredient('');
        }
    };

    const handleAddTag = () => {
        if (currentTag.trim() && !tags.includes(currentTag.trim())) {
            setTags([...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleActualUpload = async () => {
        if (!selectedFile || !previewType) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append(previewType, selectedFile);
        formData.append('caption', caption);
        formData.append('ingredients', JSON.stringify(ingredients));
        formData.append('tags', JSON.stringify(tags));
        formData.append('isVeg', String(isVeg));

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${apiUrl}/api/upload/${previewType}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || data.error || `Failed to upload ${previewType}`);
            }

            setShowSuccessModal(true);
        } catch (err: any) {
            console.error("Upload Error:", err);
            alert(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleGoToProfile = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?._id) {
            navigate(`/profile/${user._id}`);
        } else {
            navigate('/Login');
        }
    };

    const cancelPreview = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        setPreviewType(null);
        setStep(1);
        setCaption('');
        setIngredients([]);
        setTags([]);
        setIsVeg(true);
        if (postInputRef.current) postInputRef.current.value = '';
        if (shortsInputRef.current) shortsInputRef.current.value = '';
    };

    return (
        <div className="upload-page">
            <div className="upload-container">
                {/* Header */}
                <header className="upload-header">
                    <h1 className="upload-title">
                        {!previewType ? 'Create New Content' : `New ${previewType === 'post' ? 'Post' : 'Short'} (${step}/2)`}
                    </h1>
                    {previewType && step === 2 && (
                        <button className="back-step-btn" onClick={() => setStep(1)}>
                            <ChevronLeft size={20} /> Back
                        </button>
                    )}
                </header>

                <div className="upload-content">
                    <input
                        type="file"
                        ref={postInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, 'post')}
                    />
                    <input
                        type="file"
                        ref={shortsInputRef}
                        style={{ display: 'none' }}
                        accept="video/*"
                        onChange={(e) => handleFileSelect(e, 'shorts')}
                    />

                    {!previewType ? (
                        <div className="upload-options-grid">
                            <button className="option-card" onClick={() => postInputRef.current?.click()}>
                                <div className="icon-box">
                                    <ImageIcon size={32} />
                                </div>
                                <div className="text-box">
                                    <h3>Post</h3>
                                    <p>Share a photo (5:4 ratio recommended)</p>
                                </div>
                            </button>

                            <button className="option-card" onClick={() => shortsInputRef.current?.click()}>
                                <div className="icon-box">
                                    <Film size={32} />
                                </div>
                                <div className="text-box">
                                    <h3>Shorts</h3>
                                    <p>Share a video (up to 2 mins, 9:16 ratio)</p>
                                </div>
                            </button>
                        </div>
                    ) : step === 1 ? (
                        <div className="upload-preview-area">
                            <div className={`preview-frame ${previewType}`}>
                                {previewType === 'post' ? (
                                    <img src={previewUrl || ''} alt="Preview" className="preview-media" />
                                ) : (
                                    <video src={previewUrl || ''} className="preview-media" controls autoPlay loop muted />
                                )}
                            </div>

                            <div className="preview-actions">
                                <button className="btn-secondary" onClick={cancelPreview} disabled={isUploading}>
                                    Choose Different
                                </button>
                                <button className="btn-primary" onClick={() => setStep(2)}>
                                    Next <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="upload-details-area">
                            <div className="details-form">
                                {/* Caption */}
                                <div className="form-group">
                                    <label>Caption</label>
                                    <textarea
                                        placeholder="Write a caption..."
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                {/* Ingredients */}
                                <div className="form-group">
                                    <label>Ingredients</label>
                                    <div className="tag-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Add ingredient..."
                                            value={currentIngredient}
                                            onChange={(e) => setCurrentIngredient(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                                        />
                                        <button type="button" onClick={handleAddIngredient}>
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="tags-display">
                                        {ingredients.map((ing, idx) => (
                                            <span key={idx} className="tag-item">
                                                {ing} <X size={14} onClick={() => removeIngredient(idx)} />
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="form-group">
                                    <label>Tags</label>
                                    <div className="tag-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Add tags (e.g. spicy, vegan)..."
                                            value={currentTag}
                                            onChange={(e) => setCurrentTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        />
                                        <button type="button" onClick={handleAddTag}>
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                    <div className="tags-display">
                                        {tags.map((tag, idx) => (
                                            <span key={idx} className="tag-item">
                                                #{tag} <X size={14} onClick={() => removeTag(idx)} />
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Veg/Non-Veg Toggle */}
                                <div className="form-group toggle-group">
                                    <label>Dietary Preference</label>
                                    <div className="toggle-container">
                                        <span className={isVeg ? 'active' : ''}>VEG</span>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={!isVeg}
                                                onChange={() => setIsVeg(!isVeg)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                        <span className={!isVeg ? 'active' : ''}>NON-VEG</span>
                                    </div>
                                </div>

                                <div className="preview-actions">
                                    <button className="btn-secondary" onClick={() => setStep(1)} disabled={isUploading}>
                                        Back
                                    </button>
                                    <button className="btn-primary share-btn" onClick={handleActualUpload} disabled={isUploading}>
                                        {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Share Content'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isUploading && (
                    <div className="upload-overlay">
                        <div className="upload-status">
                            <Loader2 className="animate-spin" size={48} color="#ff5e00" />
                            <p>Uploading to FoodScroll...</p>
                        </div>
                    </div>
                )}

                {showSuccessModal && (
                    <div className="success-overlay">
                        <div className="success-modal">
                            <div className="success-icon-wrapper">
                                <CheckCircle2 size={64} color="#ff5e00" />
                            </div>
                            <h2 className="success-modal-title">Upload Successful!</h2>
                            <p className="success-message">
                                Your {previewType === 'post' ? 'post' : 'short'} has been shared with the FoodScroll community.
                            </p>
                            <button className="btn-primary success-btn" onClick={handleGoToProfile}>
                                View in Profile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Upload;
