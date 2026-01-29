
export enum LabelType {
    Small = 'small',
    Large = 'large',
}

export interface LabelData {
    id: number;
    // Fields for Calibration labels
    deviceId?: string;
    deviceName?: string;
    calibrationDate?: string;
    nextCalibrationDate?: string;
    
    // Fields for Generic/Free text labels
    isGeneric?: boolean;
    content?: string;
    fontSize?: number;
}

export interface SheetLayout {
    type: LabelType;
    paperWidth: number;
    paperHeight: number;
    cols: number;
    rows: number;
    total: number;
    sizeW: number;
    sizeH: number;
    gapX: number;
    gapY: number;
    marginTop: number;
    marginRight: number;
    marginBottom: number;
    marginLeft: number;
}
