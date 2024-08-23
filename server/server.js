import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { join, resolve, extname, basename, dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync, renameSync } from 'fs';
import { convertToPDF } from './conversor/conversor.js'; // Corrigido para importar corretamente
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = resolve(__dirname, 'uploads');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        console.error('Nenhum arquivo selecionado.');
        return res.status(400).send('Nenhum arquivo selecionado. Por favor, selecione um arquivo para continuar.');
    }
    
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const originalFilePath = join(dirname(filePath), originalName);
    const outputPdfPath = join(dirname(filePath), `${basename(originalName, extname(originalName))}.pdf`);

    console.log(`File received: ${filePath}, ${originalName}`);

    try {
        console.log(`Iniciando conversão para o arquivo: ${filePath}`);

        // Renomeia o arquivo
        renameSync(filePath, originalFilePath);
        console.log(`Arquivo renomeado para: ${originalFilePath}`);

        // Converte para PDF
        await convertToPDF(originalFilePath);

        console.log(`Conversão concluída. Iniciando download do arquivo: ${outputPdfPath}`);

        // Envia o arquivo PDF para download
        res.download(outputPdfPath, (err) => {
            if (err) {
                console.error(`Erro ao fazer o download do arquivo convertido: ${err}`);
                // Tenta remover arquivos em caso de erro
                if (existsSync(originalFilePath)) unlinkSync(originalFilePath);
                if (existsSync(outputPdfPath)) unlinkSync(outputPdfPath);
                if (!res.headersSent) {
                    res.status(500).send('Erro ao fazer o download do arquivo convertido.');
                }
            } else {
                // Verifica e remove arquivos após o download ser concluído
                try {
                    if (existsSync(originalFilePath)) unlinkSync(originalFilePath);
                    if (existsSync(outputPdfPath)) unlinkSync(outputPdfPath);
                    console.log(`Arquivos removidos: ${originalFilePath}, ${outputPdfPath}`);
                } catch (removeError) {
                    console.error(`Erro ao remover arquivos: ${removeError}`);
                }
            }
        });
        
    } catch (error) {
        console.error(`Erro ao processar o arquivo: ${error}`);
        // Tenta remover arquivos em caso de erro
        if (existsSync(originalFilePath)) unlinkSync(originalFilePath);
        if (existsSync(outputPdfPath)) unlinkSync(outputPdfPath);
        if (!res.headersSent) {
            res.status(500).send(`Erro ao processar o arquivo: ${error.message}`);
        }
    }
});

app.listen(port, () => {
    console.log(`Servidor está rodando em http://localhost:${port}`);
});
