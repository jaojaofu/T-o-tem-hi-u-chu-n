
import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { LabelData } from '../types';

interface ExcelImportProps {
    onImport: (data: Omit<LabelData, 'id'>[]) => void;
}

export const ExcelImport: React.FC<ExcelImportProps> = ({ onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const processExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer);
            
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
            const importedLabels: Omit<LabelData, 'id'>[] = [];

            jsonData.forEach((row) => {
                const findVal = (keys: string[]) => {
                    for (const k of Object.keys(row)) {
                        if (keys.some(key => k.toLowerCase().includes(key.toLowerCase()))) {
                            return row[k]?.toString().trim() || '';
                        }
                    }
                    return '';
                };

                const deviceId = findVal(['Mã thiết bị', 'Ma thiet bi', 'Device ID', 'Code']);
                const deviceName = findVal(['Tên thiết bị', 'Ten thiet bi', 'Device Name', 'Name']);
                const calibrationDate = findVal(['Ngày hiệu chuẩn', 'Ngay hieu chuan', 'Calibration Date']);
                const nextCalibrationDate = findVal(['Hạn hiệu chuẩn', 'Han hieu chuan', 'Next Calibration', 'Due Date']);

                if (deviceId && deviceName) {
                    importedLabels.push({
                        deviceId,
                        deviceName,
                        calibrationDate: calibrationDate || '...',
                        nextCalibrationDate: nextCalibrationDate || '...'
                    });
                }
            });

            if (importedLabels.length > 0) {
                onImport(importedLabels);
                alert(`Đã nhập thành công ${importedLabels.length} tem từ Excel.`);
            } else {
                alert('Không tìm thấy dữ liệu hợp lệ. Vui lòng kiểm tra tên cột trong file Excel.');
            }
        } catch (error) {
            console.error("Error reading excel:", error);
            alert('Lỗi khi đọc file Excel.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="mb-4">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={processExcelFile} 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
            />
            <button
                onClick={handleButtonClick}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-300 text-slate-700 font-black py-2.5 px-4 rounded-xl shadow-sm hover:bg-slate-50 transition border-dashed hover:border-blue-400 hover:text-blue-600"
            >
                {isLoading ? (
                    <span>Đang xử lý...</span>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        NHẬP TỪ EXCEL
                    </>
                )}
            </button>
            <div className="text-[10px] text-slate-400 mt-2 text-center font-bold italic">
                * Cần cột: Mã thiết bị, Tên thiết bị, Ngày HC, Hạn HC
            </div>
        </div>
    );
};
