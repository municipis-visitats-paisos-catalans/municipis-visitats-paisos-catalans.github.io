import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class MainService {

    // Variables //
    public readonly debug = window.location.hostname == "localhost" || window.location.hostname.includes("192.168.1.");
    public scroll = window.pageYOffset;
    public window = window;

    constructor() {
        // Ajustos NOMÉS al debugar //
        if (this.debug) {
            window["m"] = this;
            document.title = "Local - Municipis Cat";
        }
    }

    public log(t) { console.log(t); }
    public logDebug(t) { if (this.debug) console.log(t); }

    // Dispositius //
    public get esMobil() { return this.esPantallaTactil }
    public get esPc() { return !this.esPantallaTactil }
    public get esPantallaMobil() { return window.innerWidth < 576; }
    public get esPantallaPc() { return !this.esPantallaMobil; }
    public get esAndroid() { return /Android/i.test(navigator.userAgent); }
    public get esIOS() { return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent); }
    public get esSamsung() { return /SAMSUNG|SGH-[I|N|T]|GT-[I|P|N]|SM-[N|P|T|Z|G]|SHV-E|SCH-[I|J|R|S]|SPH-L/i.test(navigator.userAgent); }
    public get esXiaomi() { return /XiaoMi\/MiuiBrowser/i.test(navigator.userAgent); }
    public get esPantallaTactil() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; }

}
