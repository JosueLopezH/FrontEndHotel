        export interface HuespedRequest {
        nombre: string;
        apellido: string;
        email: string;
        telefono: string;
        idDocumento: string;
        nacionalidad: string;
        }

    export interface HuespedResponse {
    id: number;           // ← Debería ser id, no idHuesped
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    idDocumento: number;  // ← number, no string
    nacionalidad: string;
    }
