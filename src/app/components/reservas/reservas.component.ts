    import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
    import { FormBuilder, FormGroup, Validators } from '@angular/forms';
    import Swal from 'sweetalert2';
    import { AuthService } from '../../services/auth.service';
    import { Roles } from '../../constants/constanst';
    import { ReservasService } from '../../services/reservas.service';
import { ReservaRequest, ReservaResponse } from '../../models/Reserva.models';

    declare var bootstrap: any;

    @Component({
    selector: 'app-reservas',
    standalone: false,
    templateUrl: './reservas.component.html',
    styleUrls: ['./reservas.component.css']
    })
    export class ReservasComponent implements OnInit, AfterViewInit {

    reservas: ReservaResponse[] = [];
    reservaForm: FormGroup;
    modalText: string = 'Nueva Reserva';
    selectedReserva: ReservaResponse | null = null;
    isEditMode: boolean = false;
    showActions: boolean = false;

    @ViewChild('reservaModalRef') reservaModalEl!: ElementRef;
    private modalInstance!: any;

    constructor(
        private reservasService: ReservasService,
        private formBuilder: FormBuilder,
        private authService: AuthService
    ) {
        this.reservaForm = this.formBuilder.group({
        id: [null],
        huesped: ['', [Validators.required, Validators.maxLength(30)]],
        idHabitacion: ['', [Validators.required]],
        fechaEntrada: ['', [Validators.required]],
        fechaSalida: ['', [Validators.required]],
        noches: ['', [Validators.required]],
        total: ['', [Validators.required]],
        idEstado: ['', [Validators.required, Validators.maxLength(30)]],
        });
    }

    ngOnInit(): void {
        this.listarReservas();
        if (this.authService.hasRole(Roles.ADMIN)) {
        this.showActions = true;
        }
    }

    ngAfterViewInit(): void {
        this.modalInstance = new bootstrap.Modal(this.reservaModalEl.nativeElement, { keyboard: false });
        this.reservaModalEl.nativeElement.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
        });
    }

    listarReservas(): void {
        this.reservasService.getReservas().subscribe({
        next: resp => this.reservas = resp,
        error: err => console.error('Error al listar reservas', err)
        });
    }

    toggleForm(): void {
        this.resetForm();
        this.modalText = 'Nueva Reserva';
        this.modalInstance.show();
    }

    resetForm(): void {
        this.isEditMode = false;
        this.selectedReserva = null;
        this.reservaForm.reset();
    }

    editReserva(reserva: ReservaResponse): void {
        this.isEditMode = true;
        this.selectedReserva = reserva;
        this.modalText = 'Editando Reserva de ' + reserva.huesped;
        this.reservaForm.patchValue({ ...reserva });
        this.modalInstance.show();
    }

    onSumbmit(): void {
        if (this.reservaForm.valid) {
        const reservaData: ReservaRequest = this.reservaForm.value;

        if (this.isEditMode) {
            this.reservasService.putReserva(reservaData, reservaData.id!).subscribe({
            next: updatedReserva => {
                const index = this.reservas.findIndex(r => r.id === updatedReserva.id);
                if (index !== -1) this.reservas[index] = updatedReserva;
                Swal.fire({
                icon: 'success',
                title: 'Reserva Actualizada',
                text: 'La reserva ha sido actualizada exitosamente'
                });
                this.resetForm();
                this.modalInstance.hide();
            }
            });
        } else {
            this.reservasService.postReserva(reservaData).subscribe({
            next: newReserva => {
                this.reservas.push(newReserva);
                Swal.fire({
                icon: 'success',
                title: 'Reserva Registrada',
                text: 'La reserva ha sido registrada exitosamente'
                });
                this.resetForm();
                this.modalInstance.hide();
            }
            });
        }
        }
    }

    deleteReserva(reserva: ReservaResponse): void {
        Swal.fire({
        title: '¿Estás seguro de eliminar esta reserva?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then(result => {
        if (result.isConfirmed && reserva.id) {
            this.reservasService.deleteReserva(reserva.id).subscribe({
            next: () => {
                this.reservas = this.reservas.filter(r => r.id !== reserva.id);
                Swal.fire({
                icon: 'success',
                title: 'Reserva Eliminada',
                text: 'La reserva ha sido eliminada correctamente'
                });
            }
            });
        }
        });
    }
    }
