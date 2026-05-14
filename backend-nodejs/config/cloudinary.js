const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'foodfolio_general';
    let resource_type = 'auto'; // Automatically detect image or video
    let transformation = [];

    console.log('--- Cloudinary Storage Params Debug ---');
    console.log('Incoming File:', file.originalname, file.mimetype);

    if (req.path.includes('profile')) {
      folder = 'foodfolio_profiles';
      transformation = [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }];
    } else if (req.path.includes('post')) {
      folder = 'foodfolio_posts';
      transformation = [{ aspect_ratio: "4:5", crop: "fill", gravity: "center" }];
    } else if (req.path.includes('shorts')) {
      folder = 'foodfolio_shorts';
      resource_type = 'video';
      transformation = [{ aspect_ratio: "9:16", crop: "fill", gravity: "center" }];
    }

    const params = {
      folder: folder,
      resource_type: resource_type,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov', 'avi']
    };

    // For videos, use eager transformation and eager_async to prevent synchronous processing timeout errors
    if (req.path.includes('shorts')) {
      params.eager = transformation;
      params.eager_async = true;
    } else {
      params.transformation = transformation;
    }

    console.log('Generated Params:', params);
    return params;
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
