
import React, { useState } from 'react';
import { LabelData } from '../types';

interface LabelFormProps {
    onSubmit: (data: Omit<LabelData, 'id'>) => void;
}

export const LabelForm: React.FC<LabelFormProps> = ({ onSubmit }) => {
    const [deviceId, setDeviceId] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [calibrationDate, setCalibrationDate] = useState('');
    const [nextCalibrationDate, setNextCalibrationDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceId || !deviceName || !calibrationDate || !nextCalibrationDate) {
            alert('Vui lòng điền đầy đủ thông tin tem.');
            return;
        }
        onSubmit({ deviceId, deviceName, calibrationDate, nextCalibrationDate });
        // Reset form
        setDeviceId('');
        setDeviceName('');
        setCalibrationDate('');
        setNextCalibrationDate('');
    };

    // Common input styles: White background, Black text, Light Gray placeholder
    const inputClasses = "mt-1 w-full px-3 py-2 bg-white text-black placeholder-gray-400 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-b py-6">
            <h3 className="text-md font-semibold text-slate-800">Nhập thông tin tem</h3>
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
                className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-green-700 transition"
            >
                Thêm vào danh sách in
            </button>
        </form>
    );
};
