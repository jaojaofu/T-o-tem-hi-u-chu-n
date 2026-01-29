
import jsPDF from 'jspdf';
import { SheetLayout, LabelData, LabelType } from '../types';
import { SMALL_LABEL_SKIPPED_INDICES, LARGE_LABEL_SKIPPED_INDICES } from '../constants';

// Helper: Convert mm font size to pt for jsPDF (1 mm approx 2.835 pt)
const mmToPt = (mm: number) => mm * 2.83465;

// Font URLs (Using Roboto from a reliable CDN for Vietnamese support)
const FONT_REGULAR_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
const FONT_BOLD_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf';

// Helper: Fetch and add font to VFS
const loadFonts = async (pdf: jsPDF) => {
    const fetchFont = async (url: string) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load font from ${url}`);
        const buffer = await response.arrayBuffer();
        // Convert ArrayBuffer to binary string
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

        // Add fonts to VFS
        pdf.addFileToVFS('Roboto-Regular.ttf', regularFont);
        pdf.addFileToVFS('Roboto-Bold.ttf', boldFont);

        // Register fonts
        pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

        return true;
    } catch (error) {
        console.error("Error loading fonts:", error);
        return false;
    }
};

// Helper: Wrap text for PDF
const wrapTextPdf = (text: string, maxWidthMm: number, fontSizeMm: number) => {
    // Adjusted avg char width for Roboto to be safer
    // Increased factor to 0.6 to strictly prevent overflow into 1mm margins
    const avgCharWidthMm = fontSizeMm * 0.6; 
    const maxChars = Math.floor(maxWidthMm / avgCharWidthMm);
    
    if (text.length <= maxChars) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        if ((currentLine + ' ' + word).length <= maxChars) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
};

const drawSmallLabel = (pdf: jsPDF, x: number, y: number, data: LabelData, layout: SheetLayout) => {
    const { sizeW, sizeH } = layout;
    const centerX = x + sizeW / 2;

    // Updated font sizes: Bigger Header/ID, larger Date
    const fontSize = {
        header: 2.6, 
        id: 2.7,     
        name: 1.4,   
        date: 2.1    // Increased from 1.2
    };

    pdf.setTextColor(0, 0, 0);

    // 1. Header: JICV
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.header));
    pdf.text('JICV', centerX, y + 3.2, { align: 'center' });

    // Line under JICV
    pdf.setLineWidth(0.15);
    pdf.setDrawColor(0); // Black
    pdf.line(x + 2.5, y + 4.2, x + sizeW - 2.5, y + 4.2);

    // 2. Device ID
    // Moved down from 6.2 to 7.2 (+1.0mm)
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.id));
    pdf.text(data.deviceId, centerX, y + 7.2, { align: 'center' });

    // 3. Device Name (Wrapped)
    // Moved down from 8.8 to 9.8 (+1.0mm)
    // Constraint: 1mm margin left and right => Total padding 2mm
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(mmToPt(fontSize.name));
    
    const safeWidth = sizeW - 2.0; 
    const nameLines = wrapTextPdf(data.deviceName, safeWidth, fontSize.name).slice(0, 3);
    
    nameLines.forEach((line, i) => {
        pdf.text(line, centerX, y + 9.8 + (i * 1.7), { align: 'center' });
    });

    // 4. Separator Line
    pdf.setLineWidth(0.15); 
    pdf.setDrawColor(50);
    pdf.line(x + 2.5, y + sizeH - 6.0, x + sizeW - 2.5, y + sizeH - 6.0);
    pdf.setDrawColor(0); 

    // 5. Dates (No prefixes, larger font)
    // Space available is 6mm (from sizeH - 6.0 to sizeH)
    pdf.setFont('Roboto', 'bold'); // Using bold for dates to make them clear
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.calibrationDate, centerX, y + sizeH - 3.6, { align: 'center' });
    pdf.text(data.nextCalibrationDate, centerX, y + sizeH - 1.2, { align: 'center' });
};

const drawLargeLabel = (pdf: jsPDF, x: number, y: number, data: LabelData, layout: SheetLayout) => {
    const { sizeW, sizeH } = layout;
    const centerX = x + sizeW / 2;

    const fontSize = {
        header: 2.8,
        id: 3.8,     
        nameLabel: 1.6,
        name: 1.8,   
        dateLabel: 1.6,
        date: 2.4    // Increased from 1.8 to 2.4
    };

    pdf.setTextColor(0, 0, 0);

    // Header
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.header));
    pdf.text('JICV', centerX, y + 5.0, { align: 'center' });

    // Line
    pdf.setLineWidth(0.2);
    pdf.line(x + 3, y + 6.5, x + sizeW - 3, y + 6.5);

    // ID
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.id));
    pdf.text(data.deviceId, centerX, y + 10.5, { align: 'center' });

    // Name
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(mmToPt(fontSize.name));
    const safeWidth = sizeW - 3;
    const nameLines = wrapTextPdf(data.deviceName, safeWidth, fontSize.name).slice(0, 3);
    
    nameLines.forEach((line, i) => {
        pdf.text(line, centerX, y + 14.5 + (i * 2.2), { align: 'center' });
    });

    // Dates Section - Revised spacing for larger font
    const footerY = y + sizeH - 12; // Moved up slightly to give 12mm space
    
    pdf.setTextColor(80, 80, 80); // Gray
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('Hiệu chuẩn', centerX, footerY + 0.5, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0); // Black
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.calibrationDate, centerX, footerY + 3.2, { align: 'center' });

    pdf.setTextColor(80, 80, 80); // Gray
    pdf.setFont('Roboto', 'normal');
    pdf.setFontSize(mmToPt(fontSize.dateLabel));
    pdf.text('Tiếp theo', centerX, footerY + 6.5, { align: 'center' });

    pdf.setTextColor(0, 0, 0); // Black
    pdf.setFont('Roboto', 'bold');
    pdf.setFontSize(mmToPt(fontSize.date));
    pdf.text(data.nextCalibrationDate, centerX, footerY + 9.2, { align: 'center' });
};

export const generatePdf = async (layout: SheetLayout, labels: LabelData[], startIndex: number) => {
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [layout.paperWidth, layout.paperHeight],
    });

    await loadFonts(pdf);

    const { cols, sizeW, sizeH, gapX, gapY, marginLeft, marginTop } = layout;

    // Identify which indices to skip based on layout type
    const skippedIndices = layout.type === LabelType.Small ? SMALL_LABEL_SKIPPED_INDICES : LARGE_LABEL_SKIPPED_INDICES;

    let currentSlotIndex = startIndex;

    for (const labelData of labels) {
        // Skip indices that are in the skipped list
        // Continue incrementing currentSlotIndex until we find a valid slot
        while (skippedIndices.includes(currentSlotIndex)) {
            currentSlotIndex++;
        }

        // If for some reason we exceed the total slots, we stop
        if (currentSlotIndex > layout.total) break;

        // Calculate position for currentSlotIndex (1-based index)
        const absoluteIndex0 = currentSlotIndex - 1; // 0-based for math
        const row = Math.floor(absoluteIndex0 / cols);
        const col = absoluteIndex0 % cols;

        const x = marginLeft + col * (sizeW + gapX);
        const y = marginTop + row * (sizeH + gapY);

        if (layout.type === LabelType.Small) {
            drawSmallLabel(pdf, x, y, labelData, layout);
        } else {
            drawLargeLabel(pdf, x, y, labelData, layout);
        }

        // Prepare for next label
        currentSlotIndex++;
    }

    pdf.save(`tem-hieu-chuan-${layout.type}-${Date.now()}.pdf`);
};
