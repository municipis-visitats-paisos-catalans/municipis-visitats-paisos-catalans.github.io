import { Zona } from "src/app/models/zona.type";
import { AppStateService } from "src/app/services/app-state.service";
import { FeatureType, GeometryType } from "src/app/services/geo.service";

export class Municipi {
    id: string;
    nom: string;
    habitants: { numero: number, any: number };
    ref_idescat: string;
    ref_ine: string;
    wikidata: string;
    wikipedia: string;
    zona: Zona;

    geometry: GeometryType;

    private appState: AppStateService;

    constructor(feature: FeatureType, appState: AppStateService) {
        this.id = feature.properties["@id"];
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

    public get dataVisita(): Date | null {
        let data = this.appState.municipisVisitats[this.id] || null;
        return data ? new Date(data) : null;
    }
}
