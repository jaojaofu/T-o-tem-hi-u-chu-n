
import { SheetLayout, LabelType } from './types';

// Paper size: 165mm x 200mm
// Small Label: 16mm x 22mm (9 cols, 8 rows)
export const SMALL_LABEL_LAYOUT: SheetLayout = {
    type: LabelType.Small,
    paperWidth: 165,
    paperHeight: 200,
    cols: 9,
    rows: 8,
    total: 72,
    sizeW: 16,
    sizeH: 22,
    gapX: 2.0, 
    gapY: 3.2, // Updated: 2.9 + 0.3 calibration
    marginTop: 5.3, // Shifted down by 2mm
    marginRight: 3.0,
    marginBottom: 1.5, // Adjusted to keep total height constant
    marginLeft: 2.0, 
};

// Indices to skip for Small Labels (Left column, Right column, Bottom row)
export const SMALL_LABEL_SKIPPED_INDICES = [
    // Left Column (1, 10, 19...)
    1, 10, 19, 28, 37, 46, 55, 64,
    // Right Column (9, 18, 27...)
    9, 18, 27, 36, 45, 54, 63, 72,
    // Bottom Row (Row 8: 64-72). Note: 64 and 72 are already covered by columns.
    65, 66, 67, 68, 69, 70, 71
];

// Paper size: 165mm x 200mm
// Large Label: 19mm x 36mm (8 cols, 5 rows)
export const LARGE_LABEL_LAYOUT: SheetLayout = {
    type: LabelType.Large,
    paperWidth: 165,
    paperHeight: 200,
    cols: 8,
    rows: 5,
    total: 40,
    sizeW: 19,
    sizeH: 36,
    gapX: 1.0, // Increased from 0.5 to fix horizontal squeeze
    gapY: 3.1, // Updated: 2.5 + 0.6 calibration
    marginTop: 4.8, // Shifted down by 1mm
    marginRight: 3.0, // Adjusted based on user input (2mm + 1mm extra)
    marginBottom: 2.8, // Adjusted to ensure total height <= 200mm
    marginLeft: 3.0, // Adjusted based on user input (2mm + 1mm extra)
};

// Indices to skip for Large Labels (Left column, Right column, Bottom row)
export const LARGE_LABEL_SKIPPED_INDICES = [
    // Left Column
    1, 9, 17, 25, 33,
    // Right Column
    8, 16, 24, 32, 40,
    // Bottom Row (Row 5: 33-40). Note: 33 and 40 are already covered by columns.
    34, 35, 36, 37, 38, 39
];
