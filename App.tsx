
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
    const [activeInputTab, setActiveInputTab] = useState<'calibration' | 'generic'>('calibration');
    
    // Generic text state
    const [genericContent, setGenericContent] = useState('');
    const [genericFontSize, setGenericFontSize] = useState(3.5);

    // State to hold data for editing/copying to form
    const [formInitialData, setFormInitialData] = useState<Omit<LabelData, 'id'> | null>(null);

    // State for manual calibration offsets
    const [offsetX, setOffsetX] = useState<number>(0); 
    const [offsetY, setOffsetY] = useState<number>(0); 
    const [customGapY, setCustomGapY] = useState<number>(0);

    const [error, setError] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

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
            marginLeft: baseLayout.marginLeft + internalBaseX + offsetX,
            marginTop: baseLayout.marginTop + internalBaseY + offsetY,
            gapY: baseLayout.gapY + customGapY,
        };
    }, [labelType, offsetX, offsetY, customGapY]);

    const skippedIndices = useMemo(() => {
        return labelType === LabelType.Small ? SMALL_LABEL_SKIPPED_INDICES : LARGE_LABEL_SKIPPED_INDICES;
    }, [labelType]);

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
        setFormInitialData(null);
    };

    const addGenericLabel = () => {
        if (!genericContent.trim()) {
            alert('Vui lòng nhập nội dung văn bản.');
            return;
        }
        const newLabel: LabelData = { 
            id: Date.now() + Math.random(),
            isGeneric: true,
            content: genericContent,
            fontSize: genericFontSize
        };
        setLabelsToPrint(prev => [...prev, newLabel]);
        setGenericContent('');
    };

    const duplicateLabel = (label: LabelData) => {
        const newLabel: LabelData = { ...label, id: Date.now() + Math.random() };
        setLabelsToPrint(prev => [...prev, newLabel]);
    };

    const loadDataToForm = (label: LabelData) => {
        if (label.isGeneric) {
            setActiveInputTab('generic');
            setGenericContent(label.content || '');
            setGenericFontSize(label.fontSize || 3.5);
        } else {
            setActiveInputTab('calibration');
            const { id, ...data } = label;
            setFormInitialData(data);
        }
    };

    const addLabelsFromExcel = (dataList: Omit<LabelData, 'id'>[]) => {
        const newLabels = dataList.map(data => ({
            ...data,
            id: Date.now() + Math.random() + Math.random()
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

    // Style constants: White bg, Black text, Gray placeholder
    const inputBaseClass = "w-full px-3 py-2 bg-white text-black border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400 font-medium transition-all";

    return (
        <div className="h-screen flex flex-col bg-slate-100 text-slate-800 font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-14 flex items-center px-6 shrink-0 z-20 shadow-sm justify-between">
                <div className="flex items-center gap-2">
                    <img 
                        src="https://i.postimg.cc/prPrfBsY/luggage-tag-8632265.png" 
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            Cài đặt App
                        </button>
                    )}
                    <div className="text-sm text-slate-500">v1.5 - Stable</div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-[450px] bg-white border-r border-slate-200 flex flex-col z-10 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300">
                        <div className="space-y-8">
                            {/* Section 1: Page Config */}
                            <section className="space-y-4">
                                <h2 className="text-sm uppercase tracking-wider font-bold text-slate-500 border-b pb-2">1. Cấu hình trang in</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase opacity-70">Loại tem</label>
                                        <select
                                            value={labelType}
                                            onChange={(e) => setLabelType(e.target.value as LabelType)}
                                            className={inputBaseClass}
                                        >
                                            <option value={LabelType.Small}>Tem nhỏ (16x22mm)</option>
                                            <option value={LabelType.Large}>Tem lớn (19x36mm)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase opacity-70">Vị trí bắt đầu</label>
                                        <input
                                            type="number"
                                            value={startIndex}
                                            onChange={(e) => setStartIndex(parseInt(e.target.value, 10) || 1)}
                                            min="1"
                                            max={currentLayout.total}
                                            className={inputBaseClass}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Nhập dữ liệu */}
                            <section className="space-y-4">
                                <h2 className="text-sm uppercase tracking-wider font-bold text-slate-500 border-b pb-2">2. Nhập dữ liệu</h2>
                                
                                <div className="flex p-1 bg-slate-100 rounded-lg">
                                    <button 
                                        onClick={() => setActiveInputTab('calibration')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeInputTab === 'calibration' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tem Hiệu Chuẩn
                                    </button>
                                    <button 
                                        onClick={() => setActiveInputTab('generic')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeInputTab === 'generic' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tem Tự Do
                                    </button>
                                </div>

                                {activeInputTab === 'calibration' ? (
                                    <div className="space-y-4">
                                        <ExcelImport onImport={addLabelsFromExcel} />
                                        <LabelForm onSubmit={addLabel} initialData={formInitialData} />
                                    </div>
                                ) : (
                                    <div className="space-y-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase opacity-70">Nội dung văn bản</label>
                                            <textarea 
                                                value={genericContent}
                                                onChange={(e) => setGenericContent(e.target.value)}
                                                rows={3}
                                                className={inputBaseClass}
                                                placeholder="Nhập nội dung tem..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-xs font-semibold text-slate-700 uppercase opacity-70">Cỡ chữ: {genericFontSize}mm</label>
                                            </div>
                                            <input 
                                                type="range" min="1" max="8" step="0.1"
                                                value={genericFontSize}
                                                onChange={(e) => setGenericFontSize(parseFloat(e.target.value))}
                                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <button 
                                            onClick={addGenericLabel}
                                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-md flex items-center justify-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                            Thêm tem tự do
                                        </button>
                                    </div>
                                )}
                            </section>

                            {/* Section 3: Print List */}
                            {labelsToPrint.length > 0 && (
                                <section className="space-y-3">
                                    <div className="flex justify-between items-end border-b pb-2">
                                        <h2 className="text-sm uppercase tracking-wider font-bold text-slate-500">3. Danh sách in</h2>
                                        <button onClick={clearAllLabels} className="text-xs text-red-600 font-medium hover:underline">Xóa hết ({labelsToPrint.length})</button>
                                    </div>
                                    <div className="space-y-2">
                                        {labelsToPrint.map((label, index) => (
                                            <div key={label.id} className="group bg-white border border-slate-200 p-3 rounded-lg hover:border-blue-300 transition-all flex justify-between items-start gap-2 shadow-sm">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="flex-none bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">#{index + 1}</span>
                                                        <span className="font-bold text-sm text-slate-900 truncate">
                                                            {label.isGeneric ? "TEM TỰ DO" : label.deviceId}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 truncate italic">{label.isGeneric ? label.content : label.deviceName}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => duplicateLabel(label)} className="text-slate-400 hover:text-blue-600 p-1.5" title="Nhân bản"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" /><path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" /></svg></button>
                                                    <button onClick={() => loadDataToForm(label)} className="text-slate-400 hover:text-amber-600 p-1.5" title="Sửa"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg></button>
                                                    <button onClick={() => removeLabel(label.id)} className="text-slate-400 hover:text-red-500 p-1.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white border-t shrink-0">
                        {error && <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</div>}
                        <button
                            onClick={handleGeneratePdf}
                            disabled={!!error || labelsToPrint.length === 0 || isGenerating}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                        >
                            {isGenerating ? "ĐANG TẠO PDF..." : `XUẤT PDF (${labelsToPrint.length} TEM)`}
                        </button>
                    </div>
                </aside>

                <main className="flex-1 bg-slate-100 overflow-y-auto relative flex flex-col items-center py-10 px-8">
                    <div className="mb-6 text-center">
                         <h2 className="text-2xl font-black text-slate-800 tracking-tight">XEM TRƯỚC TRANG IN</h2>
                         <p className="text-sm text-slate-500 font-medium">Chọn vị trí tem đầu tiên bằng cách nhấp vào ô</p>
                    </div>
                    <div className="bg-white shadow-2xl relative border border-slate-200" style={{ width: '100%', maxWidth: '650px', aspectRatio: `${currentLayout.paperWidth} / ${currentLayout.paperHeight}` }}>
                         <LabelSheetPreview layout={currentLayout} labels={labelsToPrint} startIndex={startIndex} onSelectStartIndex={setStartIndex} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
