const fs = require('fs');
const PDFDocument = require('pdfkit');
const chardet = require('chardet'); // Biblioteca para detectar o encoding do arquivo

async function convertToPDF(inputFilePath, outputPdfPath) {
    try {
        // Verifica se o arquivo de entrada existe
        if (!fs.existsSync(inputFilePath)) {
            throw new Error('Arquivo de entrada não encontrado');
        }

        // Detecta o encoding do arquivo
        const encoding = chardet.detectFileSync(inputFilePath);
        if (encoding !== 'UTF-8') {
            throw new Error(`Encoding incompatível: ${encoding}`);
        }

        // Lê o conteúdo do arquivo de entrada com encoding detectado
        const originalContent = await fs.promises.readFile(inputFilePath, { encoding: 'utf8' });

        // Cria um novo documento PDF
        const doc = new PDFDocument();

        // Adiciona um manipulador de eventos de erro ao documento PDF
        doc.on('error', (err) => {
            throw new Error(`Erro ao criar PDF: ${err.message}`);
        });

        // Cria um stream de escrita para o arquivo de saída
        const stream = fs.createWriteStream(outputPdfPath);

        // Conecta o stream de escrita ao documento PDF
        doc.pipe(stream);

        // Adiciona o conteúdo original ao documento PDF
        doc.text(originalContent);

        // Finaliza o documento PDF
        doc.end();

        // Espera a finalização do stream de escrita
        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`Arquivo convertido para PDF: ${outputPdfPath}`);
    } catch (error) {
        // Remove o arquivo de saída corrompido, se existir
        if (fs.existsSync(outputPdfPath)) {
            fs.unlinkSync(outputPdfPath);
        }
        throw new Error(`Erro ao converter arquivo para PDF: ${error.message}`);
    }
}

module.exports = { convertToPDF };
