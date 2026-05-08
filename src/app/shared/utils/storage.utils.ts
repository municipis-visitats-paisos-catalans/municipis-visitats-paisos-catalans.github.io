export class StorageUtils {

    public static setCookie(cname, cvalue, exseconds = 3600) {
        if (typeof (cvalue) == "boolean") cvalue = cvalue ? 1 : 0;
        const d = new Date();
        d.setTime(d.getTime() + (exseconds * 1000));
        let expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    public static setCookieDays(cname, cvalue, exdays = 36500) {
        this.setCookie(cname, cvalue, exdays * 24 * 60 * 60);
    }
    public static getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    public static removeCookie(cname) {
        this.setCookie(cname, null, -1);
    }
    public static hasCookie(cname) {
        return this.getCookie(cname) != "";
    }
    
}
