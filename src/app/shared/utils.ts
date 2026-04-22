export class Utils {

    public static get darkMode() {
        return !(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
    }


}
