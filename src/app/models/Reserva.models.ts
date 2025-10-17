export interface ReservaRequest {
    id?: number;
    idHuesped: number;
    idHabitacion: number;
    fechaEntrada: string;
    fechaSalida: string;
    noches: number;
    total: number;
    idEstado: number;
}

export interface ReservaResponse {
    id: number;
    Huesped: {
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        telefono: string;
        idDocumento: number;
        nacionalidad: string;
    };
    Habitacion: {
        id: number;
        numero: number;
        tipo: string;
        descripcion: string;
        precio: number;
        capacidad: number;
        idEstado: number;
    };
    fechaEntrada: string;
    fechaSalida: string;
    noches: number;
    total: number;
    idEstado: number;
}