import fs from 'fs';
import PDFDocument from 'pdfkit';
import chardet from 'chardet';
import iconv from 'iconv-lite';

export async function convertToPDF(inputFilePath, outputPdfPath) {
    try {
        if (!fs.existsSync(inputFilePath)) {
            throw new Error('Arquivo de entrada não encontrado');
        }

        const encoding = chardet.detectFileSync(inputFilePath);
        console.log(`Encoding detectado: ${encoding}`);

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

        if (!originalContent) {
            throw new Error('Conteúdo do arquivo de entrada está vazio ou é inválido.');
        }

        const doc = new PDFDocument();

        doc.on('error', (err) => {
            throw new Error(`Erro ao criar PDF: ${err.message}`);
        });

        const stream = fs.createWriteStream(outputPdfPath);

        doc.pipe(stream);

        doc.text(originalContent);

        doc.end();

        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`Arquivo convertido para PDF: ${outputPdfPath}`);
    } catch (error) {
        if (fs.existsSync(outputPdfPath)) {
            fs.unlinkSync(outputPdfPath);
        }
        console.error(`Erro ao converter arquivo para PDF: ${error.message}`);
        throw new Error(`Erro ao converter arquivo para PDF: ${error.message}`);
    }
}
