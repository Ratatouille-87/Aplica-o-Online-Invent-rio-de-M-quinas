const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// Verificar se o diretório de uploads existe, se não, criar
const uploadDirectory = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
}

// Configuração do multer para armazenar os arquivos enviados
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão armazenados temporariamente
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo: timestamp + extensão original
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Limite de 10MB para o tamanho do arquivo

// Rota para lidar com o upload de arquivos
app.post('/conversao', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    // Executa o conversor.js para processar o arquivo enviado
    exec('node conversor.js ' + req.file.path, (error, stdout, stderr) => {
        if (error) {
            console.error('Erro ao executar o conversor:', error);
            res.status(500).send('Erro ao processar o arquivo.');
            return;
        }

        // Exclui o arquivo enviado após a conversão
        fs.unlinkSync(req.file.path);

        // Redireciona de volta para o index.html com mensagem de confirmação
        res.redirect('/?mensagem=Arquivo convertido com sucesso.');
    });
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