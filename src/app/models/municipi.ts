import { Zona } from "src/app/models/zona.type";
import { AppStateService } from "src/app/services/app-state.service";
import { FeatureType, GeometryType } from "src/app/services/geo.service";

export class Municipi {
    readonly id: number;
    readonly nom: string;
    readonly habitants: { numero: number, any: number };
    readonly ref_idescat: string;
    readonly ref_ine: string;
    readonly wikidata: string;
    readonly wikipedia: string;
    readonly zona: Zona;
    
    dataVisita: Date | null;
    nota: string;

    readonly geometry: GeometryType;

    private appState: AppStateService;

    constructor(feature: FeatureType, appState: AppStateService) {
        this.id = <number>feature.id;
        this.nom = feature.properties["name:ca"] || feature.properties["name"];
        this.habitants = { numero: feature.properties["population"], any: feature.properties["population:date"] };
        this.ref_idescat = feature.properties["ref:idescat"];
        this.ref_ine = feature.properties["ref:ine"];
        this.wikidata = feature.properties["wikidata"];
        this.wikipedia = feature.properties["wikipedia"];
        this.zona = feature.properties["zona"];

        this.geometry = feature.geometry;

        this.appState = appState;
    }

    public toggleVisita() {
        this.appState.toggleVisita(this.id);
    }
}
