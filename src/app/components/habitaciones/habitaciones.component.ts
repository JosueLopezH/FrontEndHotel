    import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
    import { FormBuilder, FormGroup, Validators } from '@angular/forms';
    import Swal from 'sweetalert2';
    import { AuthService } from '../../services/auth.service';
    import { HabitacionResponse } from '../../models/Habitacion.models';
    import { Roles } from '../../constants/constanst';
    import { HabitacionesService } from '../../services/habitaciones.service';

    declare var bootstrap: any;

    @Component({
    selector: 'app-habitaciones',
    standalone: false,
    templateUrl: './habitaciones.component.html',
    styleUrl: './habitaciones.component.css'
    })
    export class HabitacionesComponent implements OnInit, AfterViewInit {

    habitaciones: HabitacionResponse[] = [];
    habitacionForm: FormGroup;
    modalText: string = 'Nueva Habitación';
    selectedHabitacion: HabitacionResponse | null = null;
    isEditMode: boolean = false;
    showActions: boolean = false;

    @ViewChild('habitacionModalRef') habitacionModalEl!: ElementRef;
    private modalInstance!: any;

    constructor(
        private habitacionesService: HabitacionesService,
        private formBuilder: FormBuilder,
        private authService: AuthService
    ) {
        this.habitacionForm = this.formBuilder.group({
        id: [null],
        numero: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^(?!\s*$).+/)]],
        idtipo: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^(?!\s*$).+/)]],
        descripcion: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^(?!\s*$).+/)]],
        precio: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]{1,2})?$/)]],
        capacidad: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
        idEstado: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^(?!\s*$).+/)]],
        });
    }

    ngOnInit(): void {
        this.listarHabitaciones();
        if (this.authService.hasRole(Roles.ADMIN)) {
        this.showActions = true;
        }
    }

    ngAfterViewInit(): void {
        // Inicializa modal desde Bootstrap
        this.modalInstance = new bootstrap.Modal(this.habitacionModalEl.nativeElement, { keyboard: false });

        // Resetea el formulario al cerrar el modal
        this.habitacionModalEl.nativeElement.addEventListener('hidden.bs.modal', () => {
        this.resetForm();
        });
    }

    listarHabitaciones(): void {
        this.habitacionesService.getHabitaciones().subscribe({
        next: resp => {
            this.habitaciones = resp;
        },
        error: err => console.error('Error al listar habitaciones', err)
        });
    }

    toggleForm(): void {
        this.resetForm();
        this.modalText = 'Nueva Habitación';
        this.modalInstance.show();
    }

    resetForm(): void {
        this.isEditMode = false;
        this.selectedHabitacion = null;
        this.habitacionForm.reset();
    }

    editHabitacion(habitacion: HabitacionResponse): void {
        this.isEditMode = true;
        this.selectedHabitacion = habitacion;
        this.modalText = 'Editando Habitación ' + habitacion.numero;
        this.habitacionForm.patchValue({ ...habitacion });
        this.modalInstance.show();
    }

    onSumbmit(): void {
        if (this.habitacionForm.valid) {
        const habitacionData = this.habitacionForm.value;
        if (this.isEditMode) {
            this.habitacionesService.putHabitacion(habitacionData, habitacionData.id).subscribe({
            next: habitacion => {
                const index = this.habitaciones.findIndex(h => h.id === habitacion.id);
                if (index !== -1) {
                this.habitaciones[index] = habitacion;
                }
                Swal.fire({
                icon: 'success',
                title: 'Habitación Actualizada',
                text: 'La habitación ha sido actualizada exitosamente'
                });
                this.resetForm();
                this.modalInstance.hide();
            }
            });
        } else {
            this.habitacionesService.postHabitacion(habitacionData).subscribe({
            next: habitacion => {
                this.habitaciones.push(habitacion);
                Swal.fire({
                icon: 'success',
                title: 'Habitación Registrada',
                text: 'La habitación ha sido registrada exitosamente'
                });
                this.resetForm();
                this.modalInstance.hide();
            }
            });
        }
        }
    }

    deleteHabitacion(habitacion: HabitacionResponse): void {
        Swal.fire({
        title: '¿Estás seguro de eliminar esta habitación?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
        }).then((result: { isConfirmed: any; }) => {
        if (result.isConfirmed && habitacion.id) {
            this.habitacionesService.deleteHabitacion(habitacion.id).subscribe({
            next: () => {
                this.habitaciones = this.habitaciones.filter(h => h.id !== habitacion.id);
                Swal.fire({
                icon: 'success',
                title: 'Habitación Eliminada',
                text: 'La habitación ha sido eliminada correctamente'
                });
            }
            });
        }
        });
    }

    }
