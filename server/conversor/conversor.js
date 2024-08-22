import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import PDFDocument from 'pdfkit';
import mammoth from 'mammoth';
import ExcelJS from 'exceljs';

// Função para converter DOC para PDF usando unoconv
const convertDocToPdf = (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        exec(`unoconv -f pdf -o "${outputPath}" "${inputPath}"`, (error) => {
            if (error) {
                reject(`Erro ao converter arquivo DOC: ${error}`);
            } else {
                resolve(outputPath);
            }
        });
    });
};

// Função para criar PDF com texto
const createPDFWithText = (textContent, outputPath) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
        doc.text(textContent, { align: 'left' });
        doc.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
    });
};

// Função para adicionar uma tabela ao PDF ajustando o tamanho da página
const addTableToPDF = (doc, data, pageWidth, pageHeight) => {
    const columnWidth = 100; // Largura das colunas (ajustar conforme necessário)
    const rowHeight = 20; // Altura das linhas (ajustar conforme necessário)
    const startX = 50;
    let startY = 50;
    
    // Define o tamanho máximo de coluna e linha
    const maxColumns = Math.floor((pageWidth - 2 * startX) / columnWidth);
    const maxRowsPerPage = Math.floor((pageHeight - 2 * startY) / rowHeight);

    for (let i = 0; i < data.length; i += maxRowsPerPage) {
        if (i > 0) doc.addPage(); // Adiciona nova página se necessário

        const pageData = data.slice(i, i + maxRowsPerPage);

        pageData.forEach((row, rowIndex) => {
            row.slice(0, maxColumns).forEach((cell, colIndex) => {
                const x = startX + colIndex * columnWidth;
                const y = startY + rowIndex * rowHeight;
                const width = columnWidth;
                const height = rowHeight;

                // Adiciona o texto da célula
                doc.text(cell, x + 2, y + 2, { width: width - 4, height: height - 4 });

                // Adiciona bordas
                doc.rect(x, y, width, height).stroke();
            });
        });

        startY = 50; // Reseta a posição Y após a primeira página
    }
};

// Função para converter Excel para PDF mantendo formatação
const convertExcelToPDF = async (inputPath, outputPath) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputPath);

    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'portrait' });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    workbook.eachSheet((sheet) => {
        const data = [];
        sheet.eachRow({ includeEmpty: true }, (row) => {
            const rowData = row.values.map(value => value ? String(value) : '');
            data.push(rowData);
        });

        // Adiciona a tabela ao PDF
        addTableToPDF(doc, data, pageWidth, pageHeight);

        // Adiciona uma nova página após cada planilha
        doc.addPage();
    });

    doc.end();
    return new Promise(resolve => writeStream.on('finish', resolve));
};

// Função principal de conversão para PDF
export async function convertToPDF(inputFilePath) {
    const ext = path.extname(inputFilePath).toLowerCase();
    const baseName = path.basename(inputFilePath, ext);
    const outputPdfPath = path.join(path.dirname(inputFilePath), `${baseName}.pdf`);

    try {
        if (!fs.existsSync(inputFilePath)) {
            throw new Error(`Arquivo não encontrado: ${inputFilePath}`);
        }

        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.jfif') {
            // Se o arquivo for uma imagem
            const doc = new PDFDocument({ margin: 0 });
            const writeStream = fs.createWriteStream(outputPdfPath);
            doc.pipe(writeStream);
            const image = fs.readFileSync(inputFilePath);
            doc.image(image, 0, 0);
            doc.end();
            await new Promise(resolve => writeStream.on('finish', resolve));

        } else if (ext === '.txt') {
            // Se o arquivo for um texto
            const text = fs.readFileSync(inputFilePath, 'utf-8');
            await createPDFWithText(text, outputPdfPath);

        } else if (ext === '.docx') {
            // Se o arquivo for um DOCX
            const { value: html } = await mammoth.convertToHtml({ buffer: fs.readFileSync(inputFilePath) });
            await createPDFWithText(html, outputPdfPath);

        } else if (ext === '.doc') {
            // Se o arquivo for um DOC
            await convertDocToPdf(inputFilePath, outputPdfPath);

        } else if (ext === '.xlsx' || ext === '.xlsm') {
            // Se o arquivo for um XLSX ou XLSM
            await convertExcelToPDF(inputFilePath, outputPdfPath);

        } else {
            // Para tipos de arquivos não suportados
            const doc = new PDFDocument({ margin: 50 });
            const writeStream = fs.createWriteStream(outputPdfPath);
            doc.pipe(writeStream);
            doc.text(`Arquivo de tipo não suportado para visualização direta: ${ext}`);
            doc.text("Este arquivo foi convertido para PDF, mas o conteúdo não pode ser visualizado diretamente.");
            doc.end();
            await new Promise(resolve => writeStream.on('finish', resolve));
        }

        console.log(`Arquivo PDF gerado com sucesso: ${outputPdfPath}`);
        return outputPdfPath;

    } catch (error) {
        console.error(`Erro ao converter arquivo para PDF: ${error}`);
        throw error;
    }
}
