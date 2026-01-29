
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

    useEffect(() => {
        if (initialData) {
            setDeviceId(initialData.deviceId || '');
            setDeviceName(initialData.deviceName || '');
            setCalibrationDate(initialData.calibrationDate || '');
            setNextCalibrationDate(initialData.nextCalibrationDate || '');
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
        setDeviceId('');
        setDeviceName('');
        setCalibrationDate('');
        setNextCalibrationDate('');
    };

    const inputClasses = "mt-1 w-full px-3 py-2 bg-white text-black placeholder-slate-400 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-b py-6 relative">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Thông tin thiết bị</h3>
            </div>
            
            <div>
                <label htmlFor="device-id" className="block text-xs font-bold text-slate-700 uppercase opacity-70">Mã thiết bị</label>
                <input
                    type="text"
                    id="device-id"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    placeholder="VD: PR 108"
                    className={inputClasses}
                    required
                />
            </div>
            <div>
                <label htmlFor="device-name" className="block text-xs font-bold text-slate-700 uppercase opacity-70">Tên thiết bị</label>
                <input
                    type="text"
                    id="device-name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="VD: THƯỚC DÂY THÉP"
                    className={inputClasses}
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="calib-date" className="block text-xs font-bold text-slate-700 uppercase opacity-70">Hiệu chuẩn</label>
                    <input
                        type="text"
                        id="calib-date"
                        value={calibrationDate}
                        onChange={(e) => setCalibrationDate(e.target.value)}
                        placeholder="MM.YYYY"
                        className={inputClasses}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="next-calib-date" className="block text-xs font-bold text-slate-700 uppercase opacity-70">Hạn tiếp theo</label>
                    <input
                        type="text"
                        id="next-calib-date"
                        value={nextCalibrationDate}
                        onChange={(e) => setNextCalibrationDate(e.target.value)}
                        placeholder="MM.YYYY"
                        className={inputClasses}
                        required
                    />
                </div>
            </div>
            <button
                type="submit"
                className="w-full bg-green-600 text-white font-black py-3 px-4 rounded-xl shadow-md hover:bg-green-700 transition flex justify-center items-center gap-2 transform active:scale-95"
            >
               THÊM VÀO DANH SÁCH
            </button>
        </form>
    );
};
