import express from "express";
import multer from "multer";
import fs from "fs";
import { uploadToCloudinary } from "../upload.js";
import { parseFile } from "music-metadata";
import { db } from "../config.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/", (req, res) => {
    res.render("upload", { user: req.session.user });
});

router.post("/", upload.fields([{ name: "image" }, { name: "audio" }]), async (req, res) => {
    try {
        const { title, genre, artist } = req.body;
        const imagePath = req.files.image[0].path;
        const audioPath = req.files.audio[0].path;

        const [existing] = await db
            .promise()
            .execute("SELECT * FROM songs WHERE title = ? AND artist = ?", [title, artist]);
        if (existing.length > 0) {
            fs.unlinkSync(imagePath);
            fs.unlinkSync(audioPath);
            return res.send("این آهنگ قبلاً با همین عنوان و خواننده ثبت شده است.");
        }

        const imageResult = await uploadToCloudinary(imagePath, "image");
        const audioResult = await uploadToCloudinary(audioPath, "video");

        let durationString = "";
        try {
            const metadata = await parseFile(audioPath);
            const seconds = Math.floor(metadata.format.duration);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            durationString = `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
        } catch (err) {
            console.error("خطا در خواندن مدت موزیک:", err.message);
        }

        fs.unlinkSync(imagePath);
        fs.unlinkSync(audioPath);

        if (!imageResult || !audioResult) {
            return res.status(500).send("Upload failed.");
        }

        await db
            .promise()
            .execute(
                "INSERT INTO songs (title, artist, genre, image_url, audio_url, duration) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    title,
                    artist,
                    genre,
                    imageResult.secure_url,
                    audioResult.secure_url,
                    durationString,
                ]
            );

        res.redirect("/songs");
    } catch (error) {
        console.error("Error in /upload POST:", error);
        res.status(500).send("Server error during upload");
    }
});

export default router;
