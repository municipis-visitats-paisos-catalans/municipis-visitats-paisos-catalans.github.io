import { Injectable } from "@angular/core";
import { Municipi } from "../models/municipi.model";

@Injectable({ providedIn: 'root' })
export class MunicipisService {

    private map = new Map<string, Municipi>();

    private getId(props: any): string {
        return props['@id'];
    }

    get(props: any): Municipi {
        const id = this.getId(props);

        if (!this.map.has(id)) {
            this.map.set(id, new Municipi(props));
        }

        return this.map.get(id)!;
    }
}
