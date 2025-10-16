    import { Injectable } from '@angular/core';
    import { HuespedRequest, HuespedResponse } from '../models/Huesped.models';
    import { environment } from '../environment/enviroment';
    import { HttpClient } from '@angular/common/http';
    import { catchError, map, Observable, of } from 'rxjs';

    @Injectable({
    providedIn: 'root'
    })
    export class HuespedesService {

    private apiUrl: string = environment.apiUrl + 'huespedes/';

    constructor(private http: HttpClient) { }

    getHuespedes(): Observable<HuespedResponse[]> {
        return this.http.get<HuespedResponse[]>(this.apiUrl).pipe(
        map(huespedes => huespedes.sort((a, b) => a.id - b.id)), // opcional: ordenar por ID
        catchError(error => {
            console.error('Error al obtener los huespedes', error);
            return of([]); // Retorna un array vacío en caso de error
        })
        );
    }

    postHuesped(huesped: HuespedRequest): Observable<HuespedResponse> {
        return this.http.post<HuespedResponse>(this.apiUrl, huesped).pipe(
        catchError(error => {
            console.error('Error al registrar el huesped', error);
            throw error;
        })
        );
    }

    putHuesped(huesped: HuespedRequest, huespedId: number): Observable<HuespedResponse> {
        return this.http.put<HuespedResponse>(`${this.apiUrl}${huespedId}`, huesped).pipe(
        catchError(error => {
            console.error('Error al actualizar el huesped', error);
            throw error;
        })
        );
    }

    deleteHuesped(huespedId: number): Observable<HuespedResponse> {
        return this.http.delete<HuespedResponse>(`${this.apiUrl}${huespedId}`).pipe(
        catchError(error => {
            console.error('Error al eliminar el huesped', error);
            throw error;
        })
        );
    }

    }
