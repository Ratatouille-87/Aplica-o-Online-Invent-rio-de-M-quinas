const fs = require('fs');
const PDFDocument = require('pdfkit');

async function convertToPDF(inputFilePath, outputPdfPath) {
    try {
        const originalContent = await fs.promises.readFile(inputFilePath, 'utf8');
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(outputPdfPath));
        doc.text(originalContent);
        doc.end();
        console.log(`Arquivo convertido para PDF: ${outputPdfPath}`);
    } catch (error) {
        throw new Error(`Erro ao converter arquivo para PDF: ${error.message}`);
    }
}

module.exports = { convertToPDF };
