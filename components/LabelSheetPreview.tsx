
import React, { useMemo } from 'react';
import { SheetLayout, LabelData, LabelType } from '../types';
import { LabelDesign } from './LabelDesign';
import { SMALL_LABEL_SKIPPED_INDICES, LARGE_LABEL_SKIPPED_INDICES } from '../constants';

interface LabelSheetPreviewProps {
    layout: SheetLayout;
    labels: LabelData[];
    startIndex: number;
    onSelectStartIndex?: (index: number) => void;
}

export const LabelSheetPreview: React.FC<LabelSheetPreviewProps> = ({ layout, labels, startIndex, onSelectStartIndex }) => {
    const { paperWidth, paperHeight, cols, rows, total, sizeW, sizeH, gapX, gapY, marginLeft, marginTop } = layout;

    const skippedIndices = useMemo(() => {
        return layout.type === LabelType.Small ? SMALL_LABEL_SKIPPED_INDICES : LARGE_LABEL_SKIPPED_INDICES;
    }, [layout.type]);

    // Map label to slot index
    const slotContentMap = useMemo(() => {
        const map = new Map<number, LabelData>();
        let currentSlot = startIndex;
        
        for (const label of labels) {
            // Find next valid slot that is not skipped
            while (currentSlot <= total && skippedIndices.includes(currentSlot)) {
                currentSlot++;
            }
            
            if (currentSlot > total) break; // Out of space

            map.set(currentSlot, label);
            currentSlot++;
        }
        return map;
    }, [labels, startIndex, total, skippedIndices]);

    const renderLabels = () => {
        const items = [];
        for (let i = 0; i < total; i++) {
            const slotIndex = i + 1; // 1-based index
            const isSkipped = skippedIndices.includes(slotIndex);
            const isStartIndex = slotIndex === startIndex;
            
            const row = Math.floor(i / cols);
            const col = i % cols;

            const x = marginLeft + col * (sizeW + gapX);
            const y = marginTop + row * (sizeH + gapY);

            const labelData = slotContentMap.get(slotIndex);
            const hasLabel = !!labelData;

            // Render Skipped Slot (Visual indicator) - Non-interactive
            if (isSkipped) {
                items.push(
                    <g key={i} transform={`translate(${x}, ${y})`}>
                        <rect
                            width={sizeW}
                            height={sizeH}
                            fill="rgba(254, 202, 202, 0.2)" // Light red background
                            stroke="rgba(239, 68, 68, 0.3)" // Red border
                            strokeWidth="0.2"
                            strokeDasharray="2 1"
                            rx="0.5"
                        />
                        {/* Red Cross */}
                        <line x1="0" y1="0" x2={sizeW} y2={sizeH} stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.2" />
                        <line x1={sizeW} y1="0" x2="0" y2={sizeH} stroke="rgba(239, 68, 68, 0.3)" strokeWidth="0.2" />
                    </g>
                );
                continue;
            }

            // Render Normal Slot - Interactive
            items.push(
                <g 
                    key={i} 
                    transform={`translate(${x}, ${y})`}
                    onClick={() => onSelectStartIndex?.(slotIndex)}
                    style={{ cursor: 'pointer' }}
                    className="group"
                >
                    <rect
                        width={sizeW}
                        height={sizeH}
                        fill={hasLabel ? 'none' : 'rgba(100, 116, 139, 0.05)'}
                        stroke={hasLabel || isStartIndex ? '#3b82f6' : 'rgba(156, 163, 175, 0.2)'}
                        strokeWidth={isStartIndex ? "0.6" : "0.2"}
                        rx="0.5"
                    />
                    {!hasLabel && (
                         <text
                            x={sizeW / 2}
                            y={sizeH / 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={isStartIndex ? '#3b82f6' : 'rgba(156, 163, 175, 0.4)'}
                            fontWeight={isStartIndex ? 'bold' : 'normal'}
                            fontSize="2.5"
                        >
                            {slotIndex}
                        </text>
                    )}
                   
                    {hasLabel && (
                        <LabelDesign
                            layout={layout}
                            data={labelData}
                        />
                    )}

                    {/* Interactive Overlay & Hover Effect */}
                    <rect
                        width={sizeW}
                        height={sizeH}
                        fill="transparent"
                        className="hover:fill-blue-500 hover:fill-opacity-10 transition-all duration-200"
                        rx="0.5"
                    >
                        <title>Nhấp để bắt đầu in từ vị trí {slotIndex}</title>
                    </rect>
                </g>
            );
        }
        return items;
    };

    return (
        <svg
            viewBox={`0 0 ${paperWidth} ${paperHeight}`}
            width="100%"
            height="100%"
            className="bg-white rounded-md"
        >
            {renderLabels()}
        </svg>
    );
};
