
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
        const fontSize = { header: 2.6, id: 2.7, name: 1.4, date: 2.1 };
        const safeWidth = sizeW - 2.0;
        const nameLines = wrapText(data.deviceName || '', safeWidth, fontSize.name).slice(0, 3);

        return (
            <svg width={sizeW} height={sizeH} viewBox={`0 0 ${sizeW} ${sizeH}`} fontFamily="Arial, Helvetica, sans-serif">
                <rect width={sizeW} height={sizeH} fill="white" />
                <text x={sizeW / 2} y={3.2} textAnchor="middle" fontSize={fontSize.header} fontWeight="bold" fill="#000">JICV</text>
                <line x1={2.5} y1={4.2} x2={sizeW - 2.5} y2={4.2} stroke="#000" strokeWidth="0.15" />
                <text x={sizeW / 2} y={7.2} textAnchor="middle" fontSize={fontSize.id} fontWeight="bold" fill="#000">{data.deviceId}</text>
                {nameLines.map((line, i) => (
                    <text key={i} x={sizeW / 2} y={9.8 + (i * 1.7)} textAnchor="middle" fontSize={fontSize.name} fill="#000">{line}</text>
                ))}
                <line x1={2.5} y1={sizeH - 6.0} x2={sizeW - 2.5} y2={sizeH - 6.0} stroke="#000" strokeWidth="0.15" opacity="0.5" />
                <text x={sizeW / 2} y={sizeH - 3.6} textAnchor="middle" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.calibrationDate}</text>
                <text x={sizeW / 2} y={sizeH - 1.2} textAnchor="middle" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.nextCalibrationDate}</text>
            </svg>
        );
    }

    const fontSize = { header: 2.8, id: 3.8, name: 1.8, dateLabel: 1.6, date: 2.4 };
    const safeWidth = sizeW - 3;
    const nameLines = wrapText(data.deviceName || '', safeWidth, fontSize.name).slice(0, 3);

    return (
        <svg width={sizeW} height={sizeH} viewBox={`0 0 ${sizeW} ${sizeH}`} fontFamily="Arial, Helvetica, sans-serif">
            <rect width={sizeW} height={sizeH} fill="white" />
            <text x={sizeW / 2} y={5.0} textAnchor="middle" fontSize={fontSize.header} fontWeight="bold" fill="#000">JICV</text>
            <line x1={3} y1={6.5} x2={sizeW - 3} y2={6.5} stroke="black" strokeWidth="0.2" />
            <text x={sizeW / 2} y={10.5} textAnchor="middle" fontSize={fontSize.id} fontWeight="bold" fill="#000">{data.deviceId}</text>
            {nameLines.map((line, i) => (
                <text key={i} x={sizeW / 2} y={14.5 + (i * 2.2)} textAnchor="middle" fontSize={fontSize.name} fill="#000">{line}</text>
            ))}
            <g transform={`translate(0, ${sizeH - 12})`}>
                <text x={sizeW / 2} y={0.5} textAnchor="middle" fontSize={fontSize.dateLabel} fill="#555">Hiệu chuẩn</text>
                <text x={sizeW / 2} y={3.2} textAnchor="middle" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.calibrationDate}</text>
                <text x={sizeW / 2} y={6.5} textAnchor="middle" fontSize={fontSize.dateLabel} fill="#555">Tiếp theo</text>
                <text x={sizeW / 2} y={9.2} textAnchor="middle" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.nextCalibrationDate}</text>
            </g>
        </svg>
    );
};
