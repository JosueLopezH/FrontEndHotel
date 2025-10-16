    import { Injectable } from '@angular/core';
    import { HabitacionRequest, HabitacionResponse } from '../models/Habitacion.models';
    import { environment } from '../environment/enviroment';
    import { HttpClient } from '@angular/common/http';
    import { catchError, map, Observable, of } from 'rxjs';

    @Injectable({
    providedIn: 'root'
    })
    export class HabitacionesService {

    private apiUrl: string = environment.apiUrl + 'habitaciones/';

    constructor(private http: HttpClient) { }

    getHabitaciones(): Observable<HabitacionResponse[]> {
        return this.http.get<HabitacionResponse[]>(this.apiUrl).pipe(
        map(habitaciones => habitaciones.sort()),
        catchError(error => {
            console.error('Error al obtener las habitaciones', error);
            return of([]); // Retorna un array vacío en caso de error
        })
        );
    }

    postHabitacion(habitacion: HabitacionRequest): Observable<HabitacionResponse> {
        return this.http.post<HabitacionResponse>(this.apiUrl, habitacion).pipe(
        catchError(error => {
            console.error('Error al registrar la habitación', error);
            throw error;
        })
        );
    }

    putHabitacion(habitacion: HabitacionRequest, habitacionId: number): Observable<HabitacionResponse> {
        return this.http.put<HabitacionResponse>(`${this.apiUrl}${habitacionId}`, habitacion).pipe(
        catchError(error => {
            console.error('Error al actualizar la habitación', error);
            throw error;
        })
        );
    }

    deleteHabitacion(habitacionId: number): Observable<HabitacionResponse> {
        return this.http.delete<HabitacionResponse>(`${this.apiUrl}${habitacionId}`).pipe(
        catchError(error => {
            console.error('Error al eliminar la habitación', error);
            throw error;
        })
        );
    }

    }
