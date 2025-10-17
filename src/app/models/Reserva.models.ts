import { HabitacionResponse } from "./Habitacion.models";
import { HuespedResponse } from "./Huesped.models";

        export interface ReservaRequest {
    id?: number;
    idHuesped: number;      
    idHabitacion: number;   
    fechaEntrada: string;
    fechaSalida: string;
    noches: number;
    total: number;
    idEstado: number; // ← CORREGIR: Debe ser number, no string
}

   export interface ReservaResponse {
    idhabitacion: number;
    id: number;
    Huesped: {  // ← CON MAYÚSCULA
        id: number;
        nombre: string;
        apellido: string;
        email: string;
        telefono: string;
        idDocumento: number;
        nacionalidad: string;
    };
    Habitacion: {  // ← CON MAYÚSCULA
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