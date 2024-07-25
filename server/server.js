const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { convertToPDF } = require('./conversor/conversor.js');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.resolve(__dirname, 'uploads');
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
        console.log(`Iniciando conversão para o arquivo: ${filePath}`);
        await convertToPDF(filePath, outputPdfPath);
        console.log(`Conversão concluída. Iniciando download do arquivo: ${outputPdfPath}`);
        res.download(outputPdfPath, (err) => {
            if (err) {
                console.error(`Erro ao fazer o download do arquivo convertido: ${err}`);
                res.status(500).send('Erro ao fazer o download do arquivo convertido.');
            } else {
                fs.unlinkSync(filePath); // Remove o arquivo de entrada após o download
                fs.unlinkSync(outputPdfPath); // Remove o arquivo PDF após o download
                console.log(`Arquivos removidos: ${filePath}, ${outputPdfPath}`);
            }
        });
    } catch (error) {
        console.error(`Erro ao processar o arquivo: ${error}`);
        res.status(500).send(`Erro ao processar o arquivo: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
