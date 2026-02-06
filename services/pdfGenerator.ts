
import jsPDF from 'jspdf';
import { SheetLayout, LabelData, LabelType } from '../types';
import { SMALL_LABEL_SKIPPED_INDICES, LARGE_LABEL_SKIPPED_INDICES } from '../constants';

const mmToPt = (mm: number) => mm * 2.83465;
const FONT_REGULAR_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
const FONT_BOLD_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

const loadFonts = async (pdf: jsPDF) => {
    const fetchFont = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load font from ${url}`);
        const buffer = await response.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return binary;
    };
    try {
        const [regularFont, boldFont] = await Promise.all([
            fetchFont(FONT_REGULAR_URL),
            fetchFont(FONT_BOLD_URL)
        ]);
        pdf.addFileToVFS('Roboto-Regular.ttf', regularFont);
        pdf.addFileToVFS('Roboto-Bold.ttf', boldFont);
        pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
        return true;
    } catch (error) {
        console.error("Error loading fonts:", error);
        return false;
    }
};

const wrapTextPdf = (text: string, maxWidthMm: number, fontSizeMm: number) => {
    const avgCharWidthMm = fontSizeMm * 0.55; 
    const maxChars = Math.max(1, Math.floor(maxWidthMm / avgCharWidthMm));
    const paragraphs = text.split('\n');
    const lines: string[] = [];

    paragraphs.forEach(p => {
        const words = p.split(' ');
        if (words.length === 0 || (words.length === 1 && words[0] === '')) {
            lines.push('');
            return;
        }
        let currentLine = '';
        words.forEach(word => {
            if (word.length > maxChars) {
                if (currentLine) lines.push(currentLine);
                let rem = word;
                while (rem.length > maxChars) {
                    lines.push(rem.substring(0, maxChars));
                    rem = rem.substring(maxChars);
                }
                currentLine = rem;
            } else {
                const test = currentLine ? currentLine + ' ' + word : word;
                if (test.length <= maxChars) {
                    currentLine = test;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
        });
        if (currentLine) lines.push(currentLine);
    });
    return lines;
};

const drawGenericLabel = (pdf: jsPDF, x: number, y: number, data: LabelData, layout: SheetLayout) => {
    const { sizeW, sizeH } = layout;
    const fSize = data.fontSize || 3.5;
    
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fSize));
    pdf.setTextColor(0, 0, 0);

    const wrapWidth = sizeW - 3;
    const lines = wrapTextPdf(data.content || '', wrapWidth, fSize);
    const lineHeight = fSize * 1.25;
    const totalBlockHeight = lines.length * lineHeight;

    const centerX = x + sizeW / 2;
    const startY = y + (sizeH - totalBlockHeight) / 2 + (lineHeight / 2);

    lines.forEach((line, i) => {
        pdf.text(line, centerX, startY + (i * lineHeight), { align: 'center', baseline: 'middle' });
    });
};

const drawSmallLabel = (pdf: jsPDF, x: number, y: number, data: LabelData, layout: SheetLayout) => {
    const { sizeW } = layout;
    const centerX = x + sizeW / 2;
    // Đồng bộ font size
    const fontSize = { header: 2.2, id: 4.0, name: 1.1, dateLabel: 1.5, date: 2.2 };
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.header));
    pdf.text('JICV', centerX, y + 2.4, { align: 'center' });
    
    pdf.setLineWidth(0.15);
    pdf.line(x + 2.0, y + 3.2, x + sizeW - 2.0, y + 3.2);
    
    pdf.setFontSize(mmToPt(fontSize.id));
    pdf.text(data.deviceId || '', centerX, y + 6.8, { align: 'center' });
    
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.name));
    const nameLines = wrapTextPdf(data.deviceName || '', sizeW - 2.0, fontSize.name).slice(0, 2);
    nameLines.forEach((line, i) => {
        pdf.text(line, centerX, y + 8.8 + (i * 1.3), { align: 'center' });
    });
    
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(x + 2.5, y + 13.0, x + sizeW - 2.5, y + 13.0);
    pdf.setDrawColor(0, 0, 0);
    
    // Tọa độ ngang: Label end tại 5.2, Date start tại 5.8 (so với lề trái tem)
    const labelXAbs = x + 5.2;
    const dateXAbs = x + 5.8;

    // Line 1: From ...
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('From', labelXAbs, y + 15.8, { align: 'right' });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.calibrationDate || '', dateXAbs, y + 15.8, { align: 'left' });
    
    // Line 2: To ...
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('To', labelXAbs, y + 19.0, { align: 'right' });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.nextCalibrationDate || '', dateXAbs, y + 19.0, { align: 'left' });
};

const drawLargeLabel = (pdf: jsPDF, x: number, y: number, data: LabelData, layout: SheetLayout) => {
    const { sizeW, sizeH } = layout;
    const centerX = x + sizeW / 2;
    // Đồng bộ font size
    const fontSize = { header: 2.8, id: 3.8, name: 1.8, dateLabel: 1.8, date: 2.8 };
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.header));
    pdf.text('JICV', centerX, y + 5.0, { align: 'center' });
    pdf.setLineWidth(0.2);
    pdf.line(x + 3, y + 6.5, x + sizeW - 3, y + 6.5);
    pdf.setFontSize(mmToPt(fontSize.id));
    pdf.text(data.deviceId || '', centerX, y + 10.5, { align: 'center' });
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(mmToPt(fontSize.name));
    const nameLines = wrapTextPdf(data.deviceName || '', sizeW - 3, fontSize.name).slice(0, 3);
    nameLines.forEach((line, i) => {
        pdf.text(line, centerX, y + 14.5 + (i * 2.2), { align: 'center' });
    });
    
    const footerStartY = y + sizeH - 13;
    // Tọa độ ngang: Label end tại 6.0, Date start tại 6.8
    const labelXAbs = x + 6.0;
    const dateXAbs = x + 6.8;

    // Line 1
    pdf.setTextColor(80, 80, 80);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('From', labelXAbs, footerStartY + 5.0, { align: 'right' });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.calibrationDate || '', dateXAbs, footerStartY + 5.0, { align: 'left' });
    
    // Line 2
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('To', labelXAbs, footerStartY + 9.5, { align: 'right' });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.nextCalibrationDate || '', dateXAbs, footerStartY + 9.5, { align: 'left' });
};

export const generatePdf = async (layout: SheetLayout, labels: LabelData[], startIndex: number) => {
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [layout.paperWidth, layout.paperHeight],
    });
    const fontLoaded = await loadFonts(pdf);
    if (!fontLoaded) {
        alert("Lỗi tải font Roboto. File PDF có thể bị lỗi hiển thị tiếng Việt.");
    }
    const { cols, sizeW, sizeH, gapX, gapY, marginLeft, marginTop } = layout;
    const skippedIndices = layout.type === LabelType.Small ? SMALL_LABEL_SKIPPED_INDICES : LARGE_LABEL_SKIPPED_INDICES;
    let currentSlotIndex = startIndex;
    for (const labelData of labels) {
        while (skippedIndices.includes(currentSlotIndex)) {
            currentSlotIndex++;
        }
        if (currentSlotIndex > layout.total) break;
        const absoluteIndex0 = currentSlotIndex - 1;
        const row = Math.floor(absoluteIndex0 / cols);
        const col = absoluteIndex0 % cols;
        const x = marginLeft + col * (sizeW + gapX);
        const y = marginTop + row * (sizeH + gapY);

        if (labelData.isGeneric) {
            drawGenericLabel(pdf, x, y, labelData, layout);
        } else if (layout.type === LabelType.Small) {
            drawSmallLabel(pdf, x, y, labelData, layout);
        } else {
            drawLargeLabel(pdf, x, y, labelData, layout);
        }
        currentSlotIndex++;
    }
    pdf.save(`tem-in-${layout.type}-${Date.now()}.pdf`);
};
