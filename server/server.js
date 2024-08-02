import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { join, resolve, extname, basename, dirname } from 'path';
import { existsSync, mkdirSync, unlinkSync, renameSync } from 'fs';
import { Worker } from 'worker_threads';
import { convertToPDF } from './conversor/conversor.js';
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
        return res.status(400).send('Nenhum arquivo selecionado. Por favor, selecione um arquivo para continuar.');
    }
    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const originalFilePath = join(dirname(filePath), originalName);
    const outputPdfPath = join(dirname(filePath), `${basename(originalName, extname(originalName))}.pdf`);

    try {
        console.log(`Iniciando conversão para o arquivo: ${filePath}`);

        // Renomear o arquivo para o nome original
        renameSync(filePath, originalFilePath);
        console.log(`Arquivo renomeado para: ${originalFilePath}`);

        const worker = new Worker(new URL('./workers/worker.js', import.meta.url)); // Certifique-se de que o caminho esteja correto
        worker.postMessage(originalFilePath);

        worker.on('message', async (result) => {
            try {
                console.log(`Mensagem recebida do worker: ${result}`);
                await convertToPDF(result, outputPdfPath);
                console.log(`Conversão concluída. Iniciando download do arquivo: ${outputPdfPath}`);
                res.download(outputPdfPath, (err) => {
                    if (err) {
                        console.error(`Erro ao fazer o download do arquivo convertido: ${err}`);
                        res.status(500).send('Erro ao fazer o download do arquivo convertido.');
                    } else {
                        unlinkSync(originalFilePath);
                        unlinkSync(outputPdfPath);
                        console.log(`Arquivos removidos: ${originalFilePath}, ${outputPdfPath}`);
                    }
                });
            } catch (error) {
                console.error(`Erro ao processar o arquivo: ${error}`);
                if (existsSync(originalFilePath)) unlinkSync(originalFilePath);
                if (existsSync(outputPdfPath)) unlinkSync(outputPdfPath);
                if (!res.headersSent) {
                    res.status(500).send(`Erro ao processar o arquivo: ${error.message}`);
                }
            }
        });

        worker.on('error', (error) => {
            console.error(`Erro no worker: ${error}`);
            if (existsSync(originalFilePath)) unlinkSync(originalFilePath);
            if (existsSync(outputPdfPath)) unlinkSync(outputPdfPath);
            if (!res.headersSent) {
                res.status(500).send(`Erro no worker: ${error.message}`);
            }
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker finalizado com código: ${code}`);
                if (existsSync(originalFilePath)) unlinkSync(originalFilePath);
                if (existsSync(outputPdfPath)) unlinkSync(outputPdfPath);
                if (!res.headersSent) {
                    res.status(500).send(`Worker finalizado com código: ${code}`);
                }
            }
        });
    } catch (error) {
        console.error(`Erro ao processar o arquivo: ${error}`);
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
