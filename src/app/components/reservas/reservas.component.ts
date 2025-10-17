import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../services/auth.service';
import { Roles } from '../../constants/constanst';
import { ReservasService } from '../../services/reservas.service';
import { ReservaRequest, ReservaResponse } from '../../models/Reserva.models';
import { HuespedesService } from '../../services/huespedes.service';
import { HabitacionesService } from '../../services/habitaciones.service';

import { HuespedResponse } from '../../models/Huesped.models';
import { HabitacionResponse } from '../../models/Habitacion.models';


declare var bootstrap: any;

@Component({
  selector: 'app-reservas',
  standalone: false,
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent implements OnInit, AfterViewInit {

  reservas: ReservaResponse[] = [];
  huespedes: HuespedResponse[] = [];
  habitaciones: HabitacionResponse[] = [];
  reservaForm: FormGroup;
  modalText: string = 'Nueva Reserva';
  selectedReserva: ReservaResponse | null = null;
  isEditMode: boolean = false;
  showActions: boolean = false;

  @ViewChild('reservaModalRef') reservaModalEl!: ElementRef;
  private modalInstance!: any;

  constructor(
    private reservasService: ReservasService,
     private huespedesService: HuespedesService,
    private habitacionesService: HabitacionesService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.reservaForm = this.formBuilder.group({
      id: [null],
      idHuesped: ['', [Validators.required, Validators.maxLength(30)]],
      idHabitacion: ['', [Validators.required]],
      fechaEntrada: ['', [Validators.required]],
      fechaSalida: ['', [Validators.required]],
      noches: [0, [Validators.required, Validators.min(1)]],
      total: [0, [Validators.required, Validators.min(0)]],
      idEstado: ['', [Validators.required, Validators.maxLength(30)]],
    });

    // Agregar validadores cruzados para las fechas
    this.setupDateValidators();
  }

  ngOnInit(): void {
    this.listarReservas();
      this.listarHuespedes();
    this.listarHabitaciones();
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


  listarHuespedes(): void {
    this.huespedesService.getHuespedes().subscribe({
      next: (resp) => {
        this.huespedes = resp;
      },
      error: (err) => {
        console.error('Error al cargar huéspedes', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los huéspedes'
        });
      }
    });
  }
   listarHabitaciones(): void {
    this.habitacionesService.getHabitaciones().subscribe({
      next: (resp) => {
        this.habitaciones = resp;
      },
      error: (err) => {
        console.error('Error al cargar habitaciones', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las habitaciones'
        });
      }
    });
   }
   

 

  // Validador personalizado para fecha de entrada
  validateFechaEntrada(control: any) {
    const fechaEntrada = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas

    if (fechaEntrada < hoy) {
      return { fechaAnterior: true };
    }
    return null;
  }

  // Validador personalizado para fecha de salida
  validateFechaSalida(control: any) {
    const fechaSalida = new Date(control.value);
    const fechaEntrada = new Date(this.reservaForm?.get('fechaEntrada')?.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (!this.reservaForm?.get('fechaEntrada')?.value) {
      return { faltaFechaEntrada: true };
    }

    if (fechaSalida < hoy) {
      return { fechaAnterior: true };
    }

    if (fechaSalida <= fechaEntrada) {
      return { fechaSalidaMenor: true };
    }

    return null;
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
    
    // Actualizar validadores al abrir el modal
    this.updateDateValidators();
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
    
    // Actualizar validadores antes de mostrar el formulario
    this.updateDateValidators();
    this.reservaForm.patchValue({ 
      ...reserva,
       idHuesped: reserva.idHuesped,
      fechaEntrada: this.formatDateForInput(reserva.fechaEntrada),
      fechaSalida: this.formatDateForInput(reserva.fechaSalida)
    });
    this.modalInstance.show();
  }

  private updateDateValidators(): void {
    // Aplicar validadores personalizados
    this.reservaForm.get('fechaEntrada')?.setValidators([
      Validators.required,
      this.validateFechaEntrada.bind(this)
    ]);

    this.reservaForm.get('fechaSalida')?.setValidators([
      Validators.required,
      this.validateFechaSalida.bind(this)
    ]);

    this.reservaForm.get('fechaEntrada')?.updateValueAndValidity();
    this.reservaForm.get('fechaSalida')?.updateValueAndValidity();
  }

  private formatDateForInput(dateString: string): string {
    // Convertir fecha al formato YYYY-MM-DD para input type="date"
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSumbmit(): void {
    if (this.reservaForm.valid) {
      const reservaData: ReservaRequest = this.reservaForm.value;

      // Validación adicional por seguridad
      const fechaEntrada = new Date(reservaData.fechaEntrada);
      const fechaSalida = new Date(reservaData.fechaSalida);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaEntrada < hoy) {
        this.showDateError('La fecha de entrada no puede ser anterior al día actual');
        return;
      }

      if (fechaSalida < hoy || fechaSalida <= fechaEntrada) {
        this.showDateError('La fecha de salida no puede ser anterior al día actual ni a la fecha de entrada');
        return;
      }

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
    } else {
      this.showFormErrors();
    }
  }

  private showDateError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error en las fechas',
      text: message
    });
  }

  private showFormErrors(): void {
    // Mostrar errores específicos de validación
    const fechaEntradaErrors = this.reservaForm.get('fechaEntrada')?.errors;
    const fechaSalidaErrors = this.reservaForm.get('fechaSalida')?.errors;

    if (fechaEntradaErrors?.['fechaAnterior']) {
      this.showDateError('La fecha de entrada no puede ser anterior al día actual');
      return;
    }

    if (fechaSalidaErrors?.['fechaAnterior']) {
      this.showDateError('La fecha de salida no puede ser anterior al día actual');
      return;
    }

    if (fechaSalidaErrors?.['fechaSalidaMenor']) {
      this.showDateError('La fecha de salida no puede ser menor o igual a la fecha de entrada');
      return;
    }

    Swal.fire({
      icon: 'error',
      title: 'Formulario inválido',
      text: 'Por favor, complete todos los campos requeridos correctamente'
    });
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

  // Métodos auxiliares para mostrar mensajes de error en el template
  getFechaEntradaError(): string {
    const errors = this.reservaForm.get('fechaEntrada')?.errors;
    if (errors?.['required']) return 'La fecha de entrada es requerida';
    if (errors?.['fechaAnterior']) return 'La fecha de entrada no puede ser anterior al día actual';
    return '';
  }

  getFechaSalidaError(): string {
    const errors = this.reservaForm.get('fechaSalida')?.errors;
    if (errors?.['required']) return 'La fecha de salida es requerida';
    if (errors?.['fechaAnterior']) return 'La fecha de salida no puede ser anterior al día actual';
    if (errors?.['fechaSalidaMenor']) return 'La fecha de salida debe ser posterior a la fecha de entrada';
    if (errors?.['faltaFechaEntrada']) return 'Primero debe seleccionar una fecha de entrada';
    return '';
  }


   private setupDateValidators(): void {
    this.reservaForm.get('fechaEntrada')?.valueChanges.subscribe(() => {
      this.reservaForm.get('fechaSalida')?.updateValueAndValidity();
      this.calcularNochesYTotal();
    });

    this.reservaForm.get('fechaSalida')?.valueChanges.subscribe(() => {
      this.calcularNochesYTotal();
    });

    this.reservaForm.get('idHabitacion')?.valueChanges.subscribe(() => {
      this.calcularNochesYTotal();
    });
  }

  calcularNochesYTotal(): void {
    const fechaEntrada = this.reservaForm.get('fechaEntrada')?.value;
    const fechaSalida = this.reservaForm.get('fechaSalida')?.value;
    const idHabitacion = this.reservaForm.get('idHabitacion')?.value;

    if (fechaEntrada && fechaSalida && idHabitacion) {
      const entrada = new Date(fechaEntrada);
      const salida = new Date(fechaSalida);
      const diffTime = Math.abs(salida.getTime() - entrada.getTime());
      const noches = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const habitacion = this.habitaciones.find(h => h.id === parseInt(idHabitacion));
      if (habitacion) {
        const total = noches * habitacion.precio;
        
        this.reservaForm.patchValue({
          noches: noches,
          total: total
        }, { emitEvent: false });
      }
    }
  }

  reservaMap: { [key: string]: string } = {
    '1': 'Confirmada',
    '2': 'en curso',
    '3': 'Finalizado',
    '4': 'Cancelado'
  };

}