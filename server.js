import express from "express";
import multer from "multer";
import fs from "fs";
import OpenAI from "openai";
import { dirname,join } from "path";
import { fileURLToPath } from "url";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const port = 3000;

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
  apiKey: "YOUR OPEN-API KEY HERE"
});


const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, 'public')));
app.post('/transcribe', upload.single('audio'), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = `${req.file.path}.wav`;
  
    ffmpeg(inputPath)
      .toFormat('wav')
      .on('end', async () => {
        try {
          const response = await openai.audio.transcriptions.create({
            file: fs.createReadStream(outputPath),
            model: 'whisper-1',
            response_format: 'text',
          });
          console.log("Server Side  res : "+response);
          res.json({ transcription: response });
        } catch (error) {
          console.error('Error during transcription:', error);
          res.status(500).send('Error during transcription');
        } finally {
          fs.unlinkSync(inputPath); // Clean up the uploaded file
          fs.unlinkSync(outputPath); // Clean up the converted file
        }
      })
      .on('error', (err) => {
        console.error('Error during conversion:', err);
        res.status(500).send('Error during conversion');
      })
      .save(outputPath);
  });
  
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });