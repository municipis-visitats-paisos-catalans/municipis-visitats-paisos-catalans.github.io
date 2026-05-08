export class MunicipiUtils {

    private static readonly PREFIX = "relation/";

    public static simplificarId(id: string) {
        if (id.startsWith(this.PREFIX))
            return id.replace(this.PREFIX, "");

        return id;
    }

    public static construirId(id: string) {
        if (!id.startsWith(this.PREFIX))
            return this.PREFIX + id;

        return id;
    }

}
