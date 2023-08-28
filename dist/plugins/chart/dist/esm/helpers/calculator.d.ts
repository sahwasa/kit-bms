import { ValueEdge, LabelAxisData } from "../../types/store/store";
import { BezierPoint, Point } from "../../types/options";
export declare function getTextWidth(text: string, font?: string): number;
export declare function getTextHeight(text: string, font?: string): number;
export declare function getFontHeight(font?: string): number;
export declare function getAxisLabelAnchorPoint(labelHeight: number): number;
export declare function add(a: number, b: number): number;
export declare function multiply(a: number, b: number): number;
export declare function divide(a: number, b: number): number;
export declare function sum(values: number[]): number;
export declare function divisors(value: number): number[];
export declare function makeLabelsFromLimit(limit: ValueEdge, stepSize: number, isDateType?: boolean): string[];
export declare function makeTickPixelPositions(size: number, count: number, additionalPosition?: number, remainLastBlockIntervalPosition?: number): number[];
export declare function crispPixel(pixel: number, thickness?: number): number;
export declare function setSplineControlPoint(points: (BezierPoint | null)[]): void;
export declare function getValueRatio(value: number, { min, max }: ValueEdge): number;
export declare function getDistance(point1: Point, point2: Point): number;
export declare function getMaxLengthLabelWidth(labels: string[]): number;
export declare function getXPosition(axisData: LabelAxisData, offsetSize: number, value: number | string | Date, dataIndex: number): any;