
import React from 'react';
import { LabelData, SheetLayout, LabelType } from '../types';

interface LabelDesignProps {
    layout: SheetLayout;
    data: LabelData;
}

// Helper to wrap text based on approximate character width
const wrapText = (text: string, maxWidth: number, fontSizeMm: number) => {
    // Average char width factor for sans-serif (Inter/Arial)
    // Increased to 0.6 to match PDF strict margin enforcement
    const avgCharWidth = fontSizeMm * 0.6; 
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    
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

export const LabelDesign: React.FC<LabelDesignProps> = ({ layout, data }) => {
    const { sizeW, sizeH } = layout;

    // --- SMALL LABEL DESIGN (16mm x 22mm) ---
    if (layout.type === LabelType.Small) {
        // Dimensions in mm - Updated to match PDF
        const fontSize = {
            header: 2.6, 
            id: 2.7,     
            name: 1.4,
            date: 2.1 // Increased
        };

        // Strict 1mm margin on left and right => Total padding 2mm
        const safeWidth = sizeW - 2.0;
        const nameLines = wrapText(data.deviceName, safeWidth, fontSize.name).slice(0, 3);

        return (
            <svg width={sizeW} height={sizeH} viewBox={`0 0 ${sizeW} ${sizeH}`} fontFamily="Arial, Helvetica, sans-serif">
                <rect width={sizeW} height={sizeH} fill="white" />
                
                {/* Header: JICV */}
                <text 
                    x={sizeW / 2} 
                    y={3.2} 
                    textAnchor="middle" 
                    fontSize={fontSize.header} 
                    fontWeight="bold" 
                    fill="#000"
                >JICV</text>

                {/* Line under JICV */}
                <line x1={2.5} y1={4.2} x2={sizeW - 2.5} y2={4.2} stroke="#000" strokeWidth="0.15" />

                {/* Device ID */}
                <text 
                    x={sizeW / 2} 
                    y={7.2} 
                    textAnchor="middle" 
                    fontSize={fontSize.id} 
                    fontWeight="bold" 
                    fill="#000"
                >{data.deviceId}</text>

                {/* Device Name (Dynamic Lines) */}
                {nameLines.map((line, i) => (
                    <text 
                        key={i} 
                        x={sizeW / 2} 
                        y={9.8 + (i * 1.7)} 
                        textAnchor="middle" 
                        fontSize={fontSize.name} 
                        fill="#000"
                    >{line}</text>
                ))}

                {/* Separator line */}
                <line x1={2.5} y1={sizeH - 6.0} x2={sizeW - 2.5} y2={sizeH - 6.0} stroke="#000" strokeWidth="0.15" opacity="0.5" />

                {/* Dates (No prefixes, Stacked) */}
                <text 
                    x={sizeW / 2} 
                    y={sizeH - 3.6} 
                    textAnchor="middle" 
                    fontSize={fontSize.date} 
                    fontWeight="bold"
                    fill="#000"
                >{data.calibrationDate}</text>
                
                <text 
                    x={sizeW / 2} 
                    y={sizeH - 1.2} 
                    textAnchor="middle" 
                    fontSize={fontSize.date} 
                    fontWeight="bold"
                    fill="#000"
                >{data.nextCalibrationDate}</text>
            </svg>
        );
    }

    // --- LARGE LABEL DESIGN (19mm x 36mm) ---
    const fontSize = {
        header: 2.8,
        id: 3.8,
        nameLabel: 1.6,
        name: 1.8,
        dateLabel: 1.6,
        date: 2.4 // Increased from 1.8 to 2.4
    };

    const safeWidth = sizeW - 3;
    const nameLines = wrapText(data.deviceName, safeWidth, fontSize.name).slice(0, 3);

    return (
        <svg width={sizeW} height={sizeH} viewBox={`0 0 ${sizeW} ${sizeH}`} fontFamily="Arial, Helvetica, sans-serif">
            <rect width={sizeW} height={sizeH} fill="white" />
            
            {/* JICV */}
            <text x={sizeW / 2} y={5.0} textAnchor="middle" fontSize={fontSize.header} fontWeight="bold" fill="#000">JICV</text>
            
            <line x1={3} y1={6.5} x2={sizeW - 3} y2={6.5} stroke="black" strokeWidth="0.2" />

            {/* ID */}
            <text x={sizeW / 2} y={10.5} textAnchor="middle" fontSize={fontSize.id} fontWeight="bold" fill="#000">{data.deviceId}</text>

            {/* Name */}
            {nameLines.map((line, i) => (
                <text key={i} x={sizeW / 2} y={14.5 + (i * 2.2)} textAnchor="middle" fontSize={fontSize.name} fill="#000">{line}</text>
            ))}

            {/* Dates: Expanded area to accommodate larger font */}
            <g transform={`translate(0, ${sizeH - 12})`}>
                <text x={sizeW / 2} y={0.5} textAnchor="middle" fontSize={fontSize.dateLabel} fill="#555">Hiệu chuẩn</text>
                <text x={sizeW / 2} y={3.2} textAnchor="middle" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.calibrationDate}</text>
                
                <text x={sizeW / 2} y={6.5} textAnchor="middle" fontSize={fontSize.dateLabel} fill="#555">Tiếp theo</text>
                <text x={sizeW / 2} y={9.2} textAnchor="middle" fontSize={fontSize.date} fontWeight="bold" fill="#000">{data.nextCalibrationDate}</text>
            </g>
        </svg>
    );
};
