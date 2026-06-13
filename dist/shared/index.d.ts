import { ANY_CJK } from './patterns';
export declare class Pangu {
    version: string;
    constructor();
    spacingText(text: string): string;
    hasProperSpacing(text: string): boolean;
    private applyPunctuationSpacing;
    private applyQuoteSpacing;
    private applyHashSpacing;
    private applyOperatorSpacing;
    private applyComparisonOperatorSpacing;
    private applyFilePathSpacing;
    private applySlashSpacing;
    private applyBracketSpacing;
    private fixBracketInnerSpacing;
}
export declare const pangu: Pangu;
export { ANY_CJK };
export default pangu;
