const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const upload = multer({ dest: 'uploads/' });

const app = express();
const port = 3000;

app.use(cors()); // Middleware CORS para permitir requisições de diferentes origens

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


// Rota para lidar com o upload e conversão de arquivos
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo selecionado. Por favor, selecione um arquivo para continuar.');
    }
    const filePath = req.file.path;

    try {
        if (!fs.existsSync(filePath)) {
            throw new Error('Arquivo não encontrado');
        }

        const workbook = XLSX.readFile(filePath);
        const sheetNameList = workbook.SheetNames;
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
        
        const jsonFilePath = filePath.replace(path.extname(filePath), '.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2));
        
        res.download(jsonFilePath, (err) => {
            if (err) {
                console.error(err);
            }
            fs.unlinkSync(filePath);
            fs.unlinkSync(jsonFilePath);
        });
    } catch (error) {
        console.error('Erro ao processar o arquivo:', error);
        res.status(500).send('Erro ao processar o arquivo');
    }
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
