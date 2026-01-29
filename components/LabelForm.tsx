
import React, { useState, useEffect } from 'react';
import { LabelData } from '../types';

interface LabelFormProps {
    onSubmit: (data: Omit<LabelData, 'id'>) => void;
    initialData?: Omit<LabelData, 'id'> | null;
}

export const LabelForm: React.FC<LabelFormProps> = ({ onSubmit, initialData }) => {
    const [deviceId, setDeviceId] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [calibrationDate, setCalibrationDate] = useState('');
    const [nextCalibrationDate, setNextCalibrationDate] = useState('');

    // Effect to populate form when initialData changes (User clicked "Copy to Form")
    useEffect(() => {
        if (initialData) {
            setDeviceId(initialData.deviceId);
            setDeviceName(initialData.deviceName);
            setCalibrationDate(initialData.calibrationDate);
            setNextCalibrationDate(initialData.nextCalibrationDate);
            
            // Auto focus the device ID field for convenience
            document.getElementById('device-id')?.focus();
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceId || !deviceName || !calibrationDate || !nextCalibrationDate) {
            alert('Vui lòng điền đầy đủ thông tin tem.');
            return;
        }
        onSubmit({ deviceId, deviceName, calibrationDate, nextCalibrationDate });
        // Reset form is handled by the caller or we can clear it here if needed.
        // Usually for "Add", we clear.
        setDeviceId('');
        setDeviceName('');
        setCalibrationDate('');
        setNextCalibrationDate('');
    };

    // Common input styles: White background, Black text, Light Gray placeholder
    const inputClasses = "mt-1 w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-b py-6 relative">
            <div className="flex justify-between items-center">
                <h3 className="text-md font-semibold text-slate-800">Nhập thông tin tem</h3>
                {initialData && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">
                        Đang sao chép thông tin...
                    </span>
                )}
            </div>
            
            <div>
                <label htmlFor="device-id" className="block text-sm font-medium text-slate-700">Mã thiết bị</label>
                <input
                    type="text"
                    id="device-id"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="Ví dụ: PR 108"
                    className={inputClasses}
                    required
                />
            </div>
            <div>
                <label htmlFor="device-name" className="block text-sm font-medium text-slate-700">Tên thiết bị</label>
                <input
                    type="text"
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Ví dụ: THƯỚC DÂY THÉP"
                    className={inputClasses}
                    required
                />
            </div>
            <div>
                <label htmlFor="calib-date" className="block text-sm font-medium text-slate-700">Thời điểm hiệu chuẩn</label>
                <input
                    type="text"
                    id="calib-date"
                    value={calibrationDate}
                    onChange={(e) => setCalibrationDate(e.target.value)}
                    placeholder="Định dạng: MM.YYYY"
                    className={inputClasses}
                    pattern="\d{2}\.\d{4}"
                    title="Vui lòng nhập định dạng MM.YYYY"
                    required
                />
            </div>
            <div>
                <label htmlFor="next-calib-date" className="block text-sm font-medium text-slate-700">Hạn hiệu chuẩn tiếp theo</label>
                <input
                    type="text"
                    id="next-calib-date"
                    value={nextCalibrationDate}
                    onChange={(e) => setNextCalibrationDate(e.target.value)}
                    placeholder="Định dạng: MM.YYYY"
                    className={inputClasses}
                    pattern="\d{2}\.\d{4}"
                    title="Vui lòng nhập định dạng MM.YYYY"
                    required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 transition flex justify-center items-center gap-2"
            >
               {initialData ? (
                   <>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                       Thêm tem (Đã chỉnh sửa)
                   </>
               ) : (
                   "Thêm vào danh sách in"
               )}
            </button>
        </form>
    );
};
