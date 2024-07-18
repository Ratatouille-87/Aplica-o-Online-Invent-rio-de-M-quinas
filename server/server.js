const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { convertToPDF } = require('./conversor/conversor.js');

const app = express();
const port = 3000;

app.use(cors());

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo selecionado. Por favor, selecione um arquivo para continuar.');
    }
    const filePath = req.file.path;
    const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const outputPdfPath = path.join(path.dirname(filePath), `${originalName}.pdf`);

    try {
        await convertToPDF(filePath, outputPdfPath);
        res.download(outputPdfPath, (err) => {
            if (err) {
                console.error(err);
            }
            fs.unlinkSync(filePath); // Remove o arquivo de entrada após o download
        });
    } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
        res.status(500).send('Erro ao processar o arquivo');
    }
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
