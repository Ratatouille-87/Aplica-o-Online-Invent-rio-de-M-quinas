import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { exec } from 'child_process';

const MARGIN = 50;

// Função para converter usando LibreOffice
const convertUsingLibreOffice = async (inputPath, outputPdfDir) => {
    // Caminho correto para o executável do LibreOffice
    const libreOfficePath = `"C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"`;

    return new Promise((resolve, reject) => {
        // Crie o comando de conversão
        const command = `${libreOfficePath} --headless --convert-to pdf --outdir "${outputPdfDir}" "${inputPath}"`;
        console.log(`Executando comando: ${command}`);  // Debug: Verifique o comando gerado
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                return reject(`Erro na conversão com LibreOffice: ${error.message}`);
            }
            
            const outputPdfName = path.basename(inputPath, path.extname(inputPath)) + '.pdf';
            const outputPdfPath = path.join(outputPdfDir, outputPdfName);

            if (fs.existsSync(outputPdfPath)) {
                resolve(outputPdfPath);
            } else {
                reject(`Arquivo PDF não encontrado após a conversão: ${outputPdfPath}`);
            }
        });
    });
};

// Função principal de conversão para PDF
export async function convertToPDF(inputFilePath) {
    const ext = path.extname(inputFilePath).toLowerCase();
    const outputPdfDir = path.dirname(inputFilePath);

    try {
        if (!fs.existsSync(inputFilePath)) {
            throw new Error(`Arquivo não encontrado: ${inputFilePath}`);
        }

        let outputPdfPath;

        // Verifica se o arquivo é suportado pelo LibreOffice
        if (['.docx', '.doc', '.xlsx', '.xlsm', '.pptx', '.ppt', '.odt', '.ods', '.odp'].includes(ext)) {
            outputPdfPath = await convertUsingLibreOffice(inputFilePath, outputPdfDir);

        } else if (['.png', '.jpg', '.jpeg', '.jfif'].includes(ext)) {
            // Se o arquivo for uma imagem
            const pdfDoc = await PDFDocument.create();
            const fileBytes = await readFile(inputFilePath);
            let image;

            if (ext === '.png') {
                image = await pdfDoc.embedPng(fileBytes);
            } else {
                image = await pdfDoc.embedJpg(fileBytes);
            }

            const page = pdfDoc.addPage([image.width + 2 * MARGIN, image.height + 2 * MARGIN]);
            page.drawImage(image, {
                x: MARGIN,
                y: MARGIN,
                width: image.width,
                height: image.height,
            });

            const pdfBytes = await pdfDoc.save();
            outputPdfPath = path.join(outputPdfDir, path.basename(inputFilePath, ext) + '.pdf');
            await fs.promises.writeFile(outputPdfPath, pdfBytes);

        } else if (ext === '.txt') {
            // Se o arquivo for um texto
            const text = (await readFile(inputFilePath)).toString('utf-8');
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();

            page.drawText(text, {
                x: MARGIN,
                y: height - MARGIN,
                size: 12,
                lineHeight: 15,
                maxWidth: width - 2 * MARGIN,
            });

            const pdfBytes = await pdfDoc.save();
            outputPdfPath = path.join(outputPdfDir, path.basename(inputFilePath, ext) + '.pdf');
            await fs.promises.writeFile(outputPdfPath, pdfBytes);

        } else {
            // Caso o arquivo não seja suportado
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { width, height } = page.getSize();
            const text = `Arquivo de tipo não suportado para visualização direta: ${ext}`;

            page.drawText(text, {
                x: MARGIN,
                y: height - MARGIN,
                size: 12,
                maxWidth: width - 2 * MARGIN,
            });

            page.drawText("Este arquivo foi convertido para PDF, mas o conteúdo não pode ser visualizado diretamente.", {
                x: MARGIN,
                y: height - MARGIN - 30,
                size: 10,
                maxWidth: width - 2 * MARGIN,
            });

            const pdfBytes = await pdfDoc.save();
            outputPdfPath = path.join(outputPdfDir, path.basename(inputFilePath, ext) + '.pdf');
            await fs.promises.writeFile(outputPdfPath, pdfBytes);
        }

        console.log(`Arquivo PDF gerado com sucesso: ${outputPdfPath}`);
        return outputPdfPath;

    } catch (error) {
        console.error(`Erro na conversão para PDF: ${error}`);
        throw error;
    }
}
