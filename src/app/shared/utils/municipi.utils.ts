export class MunicipiUtils {

    private static readonly PREFIX = "relation/";

    public static simplificarId(id: string): number {
        if (id.startsWith(this.PREFIX))
            id = id.replace(this.PREFIX, "");

        return parseInt(id);
    }

    public static construirId(id: number): string {
        return this.PREFIX + id;
    }

}
