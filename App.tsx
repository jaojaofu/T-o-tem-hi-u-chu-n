
import React, { useState, useEffect, useMemo } from 'react';
import { LabelData, LabelType, SheetLayout } from './types';
import { 
    SMALL_LABEL_LAYOUT, 
    LARGE_LABEL_LAYOUT, 
    SMALL_LABEL_SKIPPED_INDICES, 
    LARGE_LABEL_SKIPPED_INDICES 
} from './constants';
import { LabelForm } from './components/LabelForm';
import { LabelSheetPreview } from './components/LabelSheetPreview';
import { ExcelImport } from './components/ExcelImport';
import { generatePdf } from './services/pdfGenerator';

const App: React.FC = () => {
    const [labelType, setLabelType] = useState<LabelType>(LabelType.Small);
    const [labelsToPrint, setLabelsToPrint] = useState<LabelData[]>([]);
    const [startIndex, setStartIndex] = useState<number>(1);
    
    // State for manual calibration offsets
    const [offsetX, setOffsetX] = useState<number>(0); 
    const [offsetY, setOffsetY] = useState<number>(0); 
    // State for vertical pitch accumulation fix
    const [customGapY, setCustomGapY] = useState<number>(0);

    const [error, setError] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // PWA Install Prompt State
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setInstallPrompt(null);
        }
    };

    const currentLayout: SheetLayout = useMemo(() => {
        const baseLayout = labelType === LabelType.Small ? SMALL_LABEL_LAYOUT : LARGE_LABEL_LAYOUT;
        
        const internalBaseX = labelType === LabelType.Small ? 0.3 : 0;
        const internalBaseY = labelType === LabelType.Small ? -0.2 : 0;

        return {
            ...baseLayout,
            // Apply layout shift
            marginLeft: baseLayout.marginLeft + internalBaseX + offsetX,
            marginTop: baseLayout.marginTop + internalBaseY + offsetY,
            // Apply cumulative pitch correction
            gapY: baseLayout.gapY + customGapY,
        };
    }, [labelType, offsetX, offsetY, customGapY]);

    const skippedIndices = useMemo(() => {
        return labelType === LabelType.Small ? SMALL_LABEL_SKIPPED_INDICES : LARGE_LABEL_SKIPPED_INDICES;
    }, [labelType]);

    // Calculate actual printable slots remaining from startIndex
    const availableSlotsCount = useMemo(() => {
        let count = 0;
        for (let i = startIndex; i <= currentLayout.total; i++) {
            if (!skippedIndices.includes(i)) {
                count++;
            }
        }
        return count;
    }, [startIndex, currentLayout.total, skippedIndices]);

    useEffect(() => {
        const quantity = labelsToPrint.length;
        if (quantity === 0) {
            setError('');
            return;
        }
        if (startIndex < 1) {
            setError('Vị trí bắt đầu phải lớn hơn 0.');
            return;
        }
        
        if (quantity > availableSlotsCount) {
            setError(`Lỗi: Số tem (${quantity}) vượt quá số vị trí khả dụng còn lại (${availableSlotsCount}).`);
        } else {
            setError('');
        }
    }, [labelsToPrint, startIndex, availableSlotsCount]);
    
    const addLabel = (data: Omit<LabelData, 'id'>) => {
        const newLabel: LabelData = { ...data, id: Date.now() + Math.random() };
        setLabelsToPrint(prev => [...prev, newLabel]);
    };

    const addLabelsFromExcel = (dataList: Omit<LabelData, 'id'>[]) => {
        const newLabels = dataList.map(data => ({
            ...data,
            id: Date.now() + Math.random() + Math.random() // Ensure unique ID
        }));
        setLabelsToPrint(prev => [...prev, ...newLabels]);
    };
    
    const removeLabel = (id: number) => {
        setLabelsToPrint(prev => prev.filter(label => label.id !== id));
    };

    const clearAllLabels = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách tem không?')) {
            setLabelsToPrint([]);
        }
    };
    
    const handleGeneratePdf = async () => {
        if (error || labelsToPrint.length === 0 || isGenerating) return;
        
        try {
            setIsGenerating(true);
            await new Promise(resolve => setTimeout(resolve, 50));
            await generatePdf(currentLayout, labelsToPrint, startIndex);
        } catch (e) {
            console.error(e);
            alert('Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.');
        } finally {
            setIsGenerating(false);
        }
    };

    const resetCalibration = () => {
        setOffsetX(0);
        setOffsetY(0);
        setCustomGapY(0);
    };

    return (
        <div className="h-screen flex flex-col bg-slate-100 text-slate-800 font-sans overflow-hidden">
            {/* Top Header */}
            <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 shrink-0 z-20 shadow-sm justify-between">
                <div className="flex items-center gap-2">
                    {/* THAY ĐỔI: Sử dụng thẻ img thay vì div chữ J. Thay link src bên dưới bằng link ảnh của bạn */}
                    <img 
                        src="https://cdn-icons-png.flaticon.com/512/2997/2997295.png" 
                        alt="Logo" 
                        className="w-8 h-8 rounded-lg object-contain"
                    />
                    <h1 className="text-lg font-bold text-slate-900">Trình tạo tem hiệu chuẩn</h1>
                </div>
                <div className="flex items-center gap-4">
                    {installPrompt && (
                        <button 
                            onClick={handleInstallClick}
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold py-1.5 px-3 rounded transition-colors flex items-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cài đặt App
                        </button>
                    )}
                    <div className="text-sm text-slate-500">
                        Phiên bản PC v1.0
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Left Sidebar: Controls & Input - Fixed Width */}
                <aside className="w-[450px] bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                        <div className="space-y-8">
                            {/* Configuration Section */}
                            <section className="space-y-4">
                                <h2 className="text-sm uppercase tracking-wider font-bold text-slate-500 border-b pb-2">1. Cấu hình trang in</h2>
                                
                                {/* Base Settings */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="label-type" className="block text-xs font-semibold text-slate-700 mb-1.5">Loại tem</label>
                                        <select
                                            id="label-type"
                                            value={labelType}
                                            onChange={(e) => setLabelType(e.target.value as LabelType)}
                                            className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value={LabelType.Small}>Tem nhỏ ({SMALL_LABEL_LAYOUT.sizeW}x{SMALL_LABEL_LAYOUT.sizeH}mm)</option>
                                            <option value={LabelType.Large}>Tem lớn ({LARGE_LABEL_LAYOUT.sizeW}x{LARGE_LABEL_LAYOUT.sizeH}mm)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="start-index" className="block text-xs font-semibold text-slate-700 mb-1.5">Vị trí bắt đầu</label>
                                        <input
                                            type="number"
                                            id="start-index"
                                            value={startIndex}
                                            onChange={(e) => setStartIndex(parseInt(e.target.value, 10) || 1)}
                                            min="1"
                                            max={currentLayout.total}
                                            className="w-full px-3 py-2 bg-white text-black border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-500 italic bg-yellow-50 p-2 rounded border border-yellow-100">
                                    Lưu ý: Hệ thống sẽ tự động bỏ qua cột đầu, cột cuối và hàng cuối cùng để đảm bảo an toàn khi in.
                                </div>

                                {/* Calibration Settings */}
                                <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-semibold text-slate-700">Hiệu chỉnh sai số máy in (mm)</label>
                                        {(offsetX !== 0 || offsetY !== 0 || customGapY !== 0) && (
                                            <button 
                                                onClick={resetCalibration}
                                                className="text-[10px] text-blue-600 hover:underline font-medium"
                                            >
                                                Đặt lại mặc định
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block mb-1" title="Dời toàn bộ trang in sang trái/phải">Dịch Lề Trái (X)</span>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={offsetX}
                                                    onChange={(e) => setOffsetX(parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-6 pr-2 py-1.5 bg-white text-black border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                                                />
                                                <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-medium">X:</span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block mb-1" title="Dời toàn bộ trang in lên/xuống">Dịch Lề Trên (Y)</span>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    value={offsetY}
                                                    onChange={(e) => setOffsetY(parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-6 pr-2 py-1.5 bg-white text-black border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                                                />
                                                <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-medium">Y:</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accumulation Fix */}
                                    <div className="pt-2 border-t border-slate-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-semibold text-slate-600">Giãn cách dòng tích lũy</span>
                                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1 rounded">Sửa lỗi lệch dần</span>
                                        </div>
                                        <div className="relative">
                                             <input
                                                type="number"
                                                step="0.1"
                                                value={customGapY}
                                                onChange={(e) => setCustomGapY(parseFloat(e.target.value) || 0)}
                                                className="w-full pl-8 pr-2 py-1.5 bg-white text-black border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                                            />
                                            <span className="absolute left-2 top-1.5 text-slate-400 text-xs font-medium">Gap:</span>
                                            <div className="mt-1 text-[10px] text-slate-500 leading-tight">
                                                * Nếu tem bên dưới bị <b>in xích lên trên</b>: Tăng số này (ví dụ: 0.1, 0.2).
                                                <br/>
                                                * Nếu tem bên dưới bị <b>in tụt xuống dưới</b>: Giảm số này (ví dụ: -0.1).
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Data Entry Section */}
                            <section className="space-y-4">
                                <h2 className="text-sm uppercase tracking-wider font-bold text-slate-500 border-b pb-2">2. Nhập dữ liệu tem</h2>
                                <div className="-mt-4">
                                    <ExcelImport onImport={addLabelsFromExcel} />
                                    <LabelForm onSubmit={addLabel} />
                                </div>
                            </section>

                            {/* List Section */}
                            {labelsToPrint.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex justify-between items-end border-b pb-2">
                                        <h2 className="text-sm uppercase tracking-wider font-bold text-slate-500">3. Danh sách chờ in</h2>
                                        <button 
                                            onClick={clearAllLabels}
                                            className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                                        >
                                            Xóa tất cả ({labelsToPrint.length})
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {labelsToPrint.map((label, index) => (
                                            <div key={label.id} className="group bg-slate-50 border border-slate-200 p-3 rounded hover:border-blue-300 hover:shadow-sm transition-all flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="flex-none bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                            #{index + 1}
                                                        </span>
                                                        <span className="font-semibold text-sm text-slate-800 truncate" title={label.deviceId}>
                                                            {label.deviceId}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate" title={label.deviceName}>{label.deviceName}</div>
                                                    <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                                                        <span>HC: {label.calibrationDate}</span>
                                                        <span>•</span>
                                                        <span>Hạn: {label.nextCalibrationDate}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => removeLabel(label.id)}
                                                    className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                                                    title="Xóa tem này"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Fixed Bottom Action Bar */}
                    <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                        {error && (
                            <div className="mb-3 px-3 py-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                <span>{error}</span>
                            </div>
                        )}
                        <button
                            onClick={handleGeneratePdf}
                            disabled={!!error || labelsToPrint.length === 0 || isGenerating}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded shadow hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang tạo PDF...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    Xuất file PDF ({labelsToPrint.length})
                                </>
                            )}
                        </button>
                    </div>
                </aside>

                {/* Right Main Area: Preview - Expands to fill rest */}
                <main className="flex-1 bg-slate-100 overflow-y-auto relative flex flex-col items-center py-10 px-8">
                    <div className="mb-4 flex flex-col items-center gap-1 opacity-70">
                         <h2 className="text-xl font-bold text-slate-700">Xem trước trang in</h2>
                         <p className="text-sm text-slate-500">Mô phỏng chính xác vị trí trên giấy khổ {currentLayout.paperWidth}x{currentLayout.paperHeight}mm</p>
                    </div>
                    
                    {/* Paper Container - Responsive but maintains aspect ratio */}
                    <div 
                        className="bg-white shadow-2xl transition-all duration-300 relative border border-slate-200"
                        style={{
                            width: '100%',
                            maxWidth: '650px', // Restrict max width for readability
                            aspectRatio: `${currentLayout.paperWidth} / ${currentLayout.paperHeight}`
                        }}
                    >
                         <LabelSheetPreview
                            layout={currentLayout}
                            labels={labelsToPrint}
                            startIndex={startIndex}
                            onSelectStartIndex={setStartIndex}
                        />
                    </div>
                    
                    <div className="mt-8 text-xs text-slate-400 text-center">
                        <p className="mb-2 text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => alert('Nhấp vào ô trên lưới để chọn vị trí bắt đầu in.')}>
                            * Mẹo: Nhấp trực tiếp vào ô trên lưới để chọn vị trí bắt đầu in
                        </p>
                        <span className="inline-block mr-3"><span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>Vị trí in</span>
                        <span className="inline-block"><span className="inline-block w-2 h-2 bg-slate-300 rounded-full mr-1"></span>Vị trí trống</span>
                        <br />
                        <span className="text-red-400 font-semibold mt-2 inline-block">* Ô có dấu gạch chéo đỏ là vùng KHÔNG IN (Do giới hạn máy in).</span>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
