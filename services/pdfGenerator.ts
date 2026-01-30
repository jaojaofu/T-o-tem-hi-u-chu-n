
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
    // ĐỒNG BỘ THÔNG SỐ VỚI LabelDesign.tsx
    const fontSize = { header: 2.4, id: 4.0, name: 1.2, dateLabel: 1.5, date: 1.5 };
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.header));
    pdf.text('JICV', centerX, y + 2.6, { align: 'center' });
    
    pdf.setLineWidth(0.15);
    pdf.line(x + 2.0, y + 3.4, x + sizeW - 2.0, y + 3.4);
    
    pdf.setFontSize(mmToPt(fontSize.id));
    pdf.text(data.deviceId || '', centerX, y + 7.2, { align: 'center' });
    
    pdf.setFont('Roboto', 'bold'); // Tên thiết bị nên in đậm cho rõ
    pdf.setFontSize(mmToPt(fontSize.name));
    const nameLines = wrapTextPdf(data.deviceName || '', sizeW - 2.0, fontSize.name).slice(0, 3);
    nameLines.forEach((line, i) => {
        pdf.text(line, centerX, y + 9.4 + (i * 1.4), { align: 'center' });
    });
    
    pdf.setLineWidth(0.1);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(x + 2.5, y + 13.8, x + sizeW - 2.5, y + 13.8);
    pdf.setDrawColor(0, 0, 0);
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('Hiệu chuẩn', centerX, y + 15.5, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.calibrationDate || '', centerX, y + 17.2, { align: 'center' });
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('Tiếp theo', centerX, y + 19.3, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.nextCalibrationDate || '', centerX, y + 21.0, { align: 'center' });
};

const drawLargeLabel = (pdf: jsPDF, x: number, y: number, data: LabelData, layout: SheetLayout) => {
    const { sizeW, sizeH } = layout;
    const centerX = x + sizeW / 2;
    const fontSize = { header: 2.8, id: 3.8, name: 1.8, dateLabel: 1.6, date: 2.4 };
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
    const footerY = y + sizeH - 12;
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('Hiệu chuẩn', centerX, footerY + 0.5, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.calibrationDate || '', centerX, footerY + 3.2, { align: 'center' });
    pdf.setTextColor(80, 80, 80);
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('Tiếp theo', centerX, footerY + 6.5, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.nextCalibrationDate || '', centerX, footerY + 9.2, { align: 'center' });
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
