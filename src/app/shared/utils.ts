export class Utils {

    public static get darkMode() {
        return !(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    }

    public static wait(ms: number): Promise<void> {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    public static async waitUntil(condicio: () => any) {
        while (!condicio())
            await new Promise(resolve => setTimeout(resolve, 100));
    }

}
