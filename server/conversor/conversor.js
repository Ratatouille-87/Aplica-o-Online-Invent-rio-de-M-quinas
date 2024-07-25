const fs = require('fs');
const PDFDocument = require('pdfkit');
const chardet = require('chardet'); // Biblioteca para detectar o encoding do arquivo
const iconv = require('iconv-lite'); // Biblioteca para converter encodings

async function convertToPDF(inputFilePath, outputPdfPath) {
    try {
        // Verifica se o arquivo de entrada existe
        if (!fs.existsSync(inputFilePath)) {
            throw new Error('Arquivo de entrada não encontrado');
        }

        // Detecta o encoding do arquivo de entrada
        const encoding = chardet.detectFileSync(inputFilePath);
        console.log(`Encoding detectado: ${encoding}`);

        // Lê o conteúdo do arquivo de entrada com o encoding detectado
        let originalContent;
        try {
            const buffer = await fs.promises.readFile(inputFilePath);
            if (encoding !== 'UTF-8' && encoding !== 'utf-8') {
                originalContent = iconv.decode(buffer, encoding);
            } else {
                originalContent = buffer.toString('utf8');
            }
        } catch (err) {
            throw new Error('Erro ao ler o arquivo de entrada. Verifique se o arquivo está no formato e encoding corretos.');
        }

        // Verifica se o conteúdo original é válido
        if (!originalContent) {
            throw new Error('Conteúdo do arquivo de entrada está vazio ou é inválido.');
        }

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
        console.error(`Erro ao converter arquivo para PDF: ${error.message}`);
        throw new Error(`Erro ao converter arquivo para PDF: ${error.message}`);
    }
}

module.exports = { convertToPDF };
