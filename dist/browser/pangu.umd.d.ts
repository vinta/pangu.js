import pangu, { BrowserPangu } from './pangu';
declare global {
    interface Window {
        pangu: typeof pangu & {
            BrowserPangu: typeof BrowserPangu;
        };
    }
}
export default pangu;
