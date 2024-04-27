const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const conversorPath = path.join('\conversor');
const conversor = require(conversorPath);

const app = express();
const PORT = 3000;

// Configuração do multer para armazenar os arquivos enviados
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão armazenados temporariamente
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo: timestamp + extensão original
    }
});

const upload = multer({ storage: storage });

// Rota para lidar com o upload de arquivos
app.post('/conversao', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    const filePath = req.file.path;
    const outputPdfPath = `${filePath}.pdf`;

    try {
        // Converter o arquivo para PDF
        await conversor(filePath, outputPdfPath);

        // Enviar o arquivo PDF convertido como resposta
        res.download(outputPdfPath, () => {
            // Excluir arquivos temporários após o download
            fs.unlinkSync(filePath);
            fs.unlinkSync(outputPdfPath);
        });
        res.status(200).send('Arquivo recebido e salvo com sucesso.');
    } catch (error) {
        console.error('Erro ao converter o arquivo para PDF:', error);
        res.status(500).send('Erro ao converter o arquivo para PDF.');
    }
});



// Servir os arquivos estáticos na pasta 'uploads'
app.use(express.static('uploads'));

// Servir o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
