import { Zona } from "src/app/shared/zona";

export class Municipi {
    id: string;
    nom: string;
    zona: Zona;

    dataVisita: Date | null = null;

    constructor(props: any) {
        this.id = props['@id'];
        this.nom = props['name:ca'] || props['name'];
        this.zona = props['zona'];
    }

    get visitat(): boolean {
        return this.dataVisita !== null;
    }

    toggleVisita() {
        this.dataVisita = this.dataVisita ? null : new Date();
    }
}
