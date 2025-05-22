import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const uploadToCloudinary = async (filePath, resourceType = "image") => {
    try {
        const result = await cloudinary.v2.uploader.upload(filePath, {
            resource_type: resourceType,
        });
        return result;
    } catch (err) {
        console.error("Upload error:", err);
        return null;
    }
};

export { uploadToCloudinary };
