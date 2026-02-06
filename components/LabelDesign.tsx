
import React from 'react';
import { LabelData, SheetLayout, LabelType } from '../types';

interface LabelDesignProps {
    layout: SheetLayout;
    data: LabelData;
}

const wrapText = (text: string, maxWidth: number, fontSizeMm: number) => {
    const avgCharWidth = fontSizeMm * 0.55; 
    const maxChars = Math.max(1, Math.floor(maxWidth / avgCharWidth));
    
    if (text.length <= maxChars && !text.includes('\n')) return [text];

    const paragraphs = text.split('\n');
    const lines: string[] = [];

    paragraphs.forEach(p => {
        const words = p.split(' ');
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
                const testLine = currentLine ? currentLine + ' ' + word : word;
                if (testLine.length <= maxChars) {
                    currentLine = testLine;
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

export const LabelDesign: React.FC<LabelDesignProps> = ({ layout, data }) => {
    const { sizeW, sizeH } = layout;

    if (data.isGeneric) {
        const fSize = data.fontSize || 3.5;
        const wrapWidth = sizeW - 3;
        const textLines = wrapText(data.content || '', wrapWidth, fSize);
        
        const lineHeight = fSize * 1.25;
        const totalBlockHeight = textLines.length * lineHeight;
        const startY = (sizeH - totalBlockHeight) / 2 + (lineHeight / 2);

        return (
            <svg width={sizeW} height={sizeH} viewBox={`0 0 ${sizeW} ${sizeH}`} fontFamily="Arial, Helvetica, sans-serif">
                <rect width={sizeW} height={sizeH} fill="white" />
                {textLines.map((line, i) => (
                    <text 
                        key={i} 
                        x={sizeW / 2} 
                        y={startY + (i * lineHeight)} 
                        textAnchor="middle" 
                        dominantBaseline="central"
                        fontSize={fSize} 
                        fontWeight="bold" 
                        fill="#000"
                    >
                        {line}
                    </text>
                ))}
            </svg>
        );
    }

    if (layout.type === LabelType.Small) {
        // Cùng 1 hàng: [From] [MM.YYYY]
        // Phân chia không gian: Split point tại x=5.5mm
        const fontSize = { header: 2.2, id: 4.0, name: 1.1, dateLabel: 1.5, date: 2.2 };
        const safeWidth = sizeW - 2.0;
        const nameLines = wrapText(data.deviceName || '', safeWidth, fontSize.name).slice(0, 2);

        // Tọa độ chia cột cho ngày tháng (căn chỉnh thủ công để cân đối visual)
        const labelX = 5.2; // Kết thúc của label (Align Right)
        const dateX = 5.8;  // Bắt đầu của date (Align Left)

        return (
            <svg width={sizeW} height={sizeH} viewBox={`0 0 ${sizeW} ${sizeH}`} fontFamily="Arial, Helvetica, sans-serif">
                <rect width={sizeW} height={sizeH} fill="white" />
                
                {/* 1. Header */}
                <text x={sizeW / 2} y={2.4} textAnchor="middle" fontSize={fontSize.header} fontWeight="bold" fill="#000">JICV</text>
                <line x1={2.0} y1={3.2} x2={sizeW - 2.0} y2={3.2} stroke="#000" strokeWidth="0.15" />
                
                {/* 2. Device ID */}
                <text x={sizeW / 2} y={6.8} textAnchor="middle" fontSize={fontSize.id} fontWeight="bold" fill="#000">{data.deviceId}</text>
                
                {/* 3. Device Name */}
                {nameLines.map((line, i) => (
                    <text key={i} x={sizeW / 2} y={8.8 + (i * 1.3)} textAnchor="middle" fontSize={fontSize.name} fill="#000" fontWeight="bold">{line}</text>
                ))}
                
                {/* 4. Bottom Divider */}
                <line x1={2.5} y1={13.0} x2={sizeW - 2.5} y2={13.0} stroke="#000" strokeWidth="0.1" opacity="0.2" />
                
                {/* 5. Calibration Dates - Horizontal Layout */}
                {/* From row */}
                <text x={labelX} y={15.8} textAnchor="end" fontSize={fontSize.dateLabel} fill="#666" fontWeight="bold">From</text>
                <text x={dateX} y={15.8} textAnchor="start" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.calibrationDate}</text>
                
                {/* To row */}
                <text x={labelX} y={19.0} textAnchor="end" fontSize={fontSize.dateLabel} fill="#666" fontWeight="bold">To</text>
                <text x={dateX} y={19.0} textAnchor="start" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.nextCalibrationDate}</text>
            </svg>
        );
    }

    // Tem lớn: Cùng 1 hàng
    const fontSize = { header: 2.8, id: 3.8, name: 1.8, dateLabel: 1.8, date: 2.8 };
    const safeWidth = sizeW - 3;
    const nameLines = wrapText(data.deviceName || '', safeWidth, fontSize.name).slice(0, 3);
    
    // Tọa độ chia cột tem lớn
    const labelX = 6.0; 
    const dateX = 6.8;

    return (
        <svg width={sizeW} height={sizeH} viewBox={`0 0 ${sizeW} ${sizeH}`} fontFamily="Arial, Helvetica, sans-serif">
            <rect width={sizeW} height={sizeH} fill="white" />
            <text x={sizeW / 2} y={5.0} textAnchor="middle" fontSize={fontSize.header} fontWeight="bold" fill="#000">JICV</text>
            <line x1={3} y1={6.5} x2={sizeW - 3} y2={6.5} stroke="black" strokeWidth="0.2" />
            <text x={sizeW / 2} y={10.5} textAnchor="middle" fontSize={fontSize.id} fontWeight="bold" fill="#000">{data.deviceId}</text>
            {nameLines.map((line, i) => (
                <text key={i} x={sizeW / 2} y={14.5 + (i * 2.2)} textAnchor="middle" fontSize={fontSize.name} fill="#000">{line}</text>
            ))}
            
            <g transform={`translate(0, ${sizeH - 13})`}>
                {/* From Row */}
                <text x={labelX} y={5.0} textAnchor="end" fontSize={fontSize.dateLabel} fill="#555" fontWeight="bold">From</text>
                <text x={dateX} y={5.0} textAnchor="start" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.calibrationDate}</text>
                
                {/* To Row */}
                <text x={labelX} y={9.5} textAnchor="end" fontSize={fontSize.dateLabel} fill="#555" fontWeight="bold">To</text>
                <text x={dateX} y={9.5} textAnchor="start" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.nextCalibrationDate}</text>
            </g>
        </svg>
    );
};
