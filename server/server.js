const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const conversorPath = path.join(__dirname, 'conversor/conversor.js');
const conversor = require(conversorPath);
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware para permitir todas as origens (CORS)
app.use(cors());

// Configuração do Multer para armazenamento de arquivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão armazenados temporariamente
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo: timestamp + extensão original
    }
});

const upload = multer({ storage: storage });

// Rota para lidar com o upload de arquivos
app.post('/conversor', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Nenhum arquivo enviado.');
        }

        const filePath = req.file.path;
        const outputPdfPath = `${filePath}.pdf`;

        console.log(`Arquivo enviado: ${filePath}`);
        console.log(`Convertendo para: ${outputPdfPath}`);

        const { PDFDocument } = require('pdf-lib');
        const fs = require('fs').promises;
        
        async function converterParaPDF(inputPath, outputPath) {
            const existingPdfBytes = await fs.readFile(inputPath);
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
        
            // Modificar o PDFDoc conforme necessário
            // Exemplo: Adicionar páginas, conteúdo, etc.
        
            const pdfBytes = await pdfDoc.save();
            await fs.writeFile(outputPath, pdfBytes);
        }
        
        module.exports = converterParaPDF;

        // Exemplo de resposta com download do arquivo convertido
        res.download(outputPdfPath, () => {
            // Excluir arquivos temporários após o download
            fs.unlinkSync(filePath);
            fs.unlinkSync(outputPdfPath);
        });
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

// Middleware para tratamento de erros
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Algo quebrou!');
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
