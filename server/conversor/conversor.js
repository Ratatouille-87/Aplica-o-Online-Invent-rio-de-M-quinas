import fs from 'fs';
import PDFDocument from 'pdfkit';
import chardet from 'chardet';
import iconv from 'iconv-lite';

export async function convertToPDF(inputFilePath, outputPdfPath) {
    try {
        // Verifica se o arquivo de entrada existe
        if (!fs.existsSync(inputFilePath)) {
            throw new Error('Arquivo de entrada não encontrado');
        }

        const doc = new PDFDocument();
        doc.on('error', (err) => {
            throw new Error(`Erro ao criar PDF: ${err.message}`);
        });

        // Cria um stream de saída para o PDF
        const stream = fs.createWriteStream(outputPdfPath);
        doc.pipe(stream);

        // Detecta o encoding do arquivo para determinar se é texto ou binário
        const encoding = chardet.detectFileSync(inputFilePath);
        console.log(`Encoding detectado: ${encoding}`);

        if (encoding && encoding !== 'binary') {
            // Trata arquivos de texto
            try {
                const buffer = await fs.promises.readFile(inputFilePath);
                const content = iconv.decode(buffer, encoding);
                if (content) {
                    doc.text(content);
                } else {
                    throw new Error('Erro ao decodificar o conteúdo do arquivo de texto.');
                }
            } catch (err) {
                throw new Error('Erro ao ler ou decodificar o arquivo de entrada.');
            }
        } else {
            // Trata arquivos binários
            try {
                const buffer = await fs.promises.readFile(inputFilePath);
                const mimeType = detectMimeType(buffer);

                if (mimeType.startsWith('image/')) {
                    // Se for uma imagem, adiciona ao PDF
                    doc.image(buffer, {
                        fit: [500, 500], // Ajusta a imagem ao tamanho da página
                        align: 'center',
                        valign: 'center'
                    });
                } else if (mimeType === 'application/pdf') {
                    // Se já for um PDF, simplesmente adiciona ao novo PDF
                    doc.addPage().text('PDF embutido:').text(buffer.toString('base64'));
                } else {
                    // Se for outro tipo de arquivo binário, adiciona como base64
                    doc.text('Conteúdo binário (base64):').text(buffer.toString('base64'));
                }
            } catch (err) {
                throw new Error('Erro ao ler ou processar o arquivo binário.');
            }
        }

        doc.end();

        // Espera a conclusão da escrita do PDF
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

function detectMimeType(buffer) {
    const fileType = require('file-type');
    const type = fileType(buffer);
    return type ? type.mime : 'binary/octet-stream';
}
