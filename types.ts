
export enum LabelType {
    Small = 'small',
    Large = 'large',
}

export interface LabelData {
    id: number;
    deviceId: string;
    deviceName: string;
    calibrationDate: string;
    nextCalibrationDate: string;
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
