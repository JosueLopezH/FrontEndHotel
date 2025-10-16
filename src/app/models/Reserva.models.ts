    export interface ReservaRequest {
    id: number;
    huesped: string;
    idHabitacion: number;
    fechaEntrada: string; // puedes usar string o Date según tu backend
    fechaSalida: string;
    noches: number;
    total: number;
    idEstado: string;
    }

    export interface ReservaResponse {
    id: number;
    huesped: string;
    idHabitacion: number;
    fechaEntrada: string;
    fechaSalida: string;
    noches: number;
    total: number;
    idEstado: string;
    }
