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
  showActions: boolean = true;

  @ViewChild('reservaModalRef') reservaModalEl!: ElementRef;
  private modalInstance!: any;
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private reservasService: ReservasService,
    private huespedesService: HuespedesService,
    private habitacionesService: HabitacionesService,
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    // FORMGROUP CORREGIDO - Campos numéricos como números
    this.reservaForm = this.formBuilder.group({
      id: [null],
      idHuesped: [null, [Validators.required]], // ← CORREGIDO: Quitado maxLength para números
      idHabitacion: [null, [Validators.required]],
      fechaEntrada: ['', [Validators.required]],
      fechaSalida: ['', [Validators.required]],
      noches: [0, [Validators.required, Validators.min(1)]],
      total: [0, [Validators.required, Validators.min(0)]],
      idEstado: [1, [Validators.required]], // ← CORREGIDO: Número en lugar de string
    });

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
        console.log('🔍 HUÉSPEDES - Datos cargados:', this.huespedes);
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
        console.log('🔍 HABITACIONES - Datos cargados:', this.habitaciones);
      }
      ,

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

  // MÉTODOS PARA MOSTRAR NOMBRES EN LA TABLA
  getNombreHuesped(idHuesped: number): string {
    const huesped = this.huespedes.find(h => h.id === idHuesped);
    return huesped ? `${huesped.nombre} ${huesped.apellido}` : 'Huésped no encontrado';
  }

  getDescripcionHabitacion(idHabitacion: number): string {
    const habitacion = this.habitaciones.find(h => h.id === idHabitacion);
    return habitacion ? `Hab. ${habitacion.numero} - ${habitacion.tipo}` : 'Habitación no encontrada';
  }

  // Validador personalizado para fecha de entrada
  validateFechaEntrada(control: any) {
    const fechaEntrada = new Date(control.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

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
    next: resp => {
      this.reservas = resp;
      console.log('🔍 RESERVAS - Datos recibidos:', this.reservas);
    },
    error: err => console.error('Error al listar reservas', err)
  });
}

  toggleForm(): void {
    this.resetForm();
    this.modalText = 'Nueva Reserva';
    this.updateDateValidators();
    this.modalInstance.show();
  }

  resetForm(): void {
    this.isEditMode = false;
    this.selectedReserva = null;
    // RESET CORREGIDO - Valores por defecto apropiados
    this.reservaForm.reset({
      id: null,
      idHuesped: null,
      idHabitacion: null,
      fechaEntrada: '',
      fechaSalida: '',
      noches: 0,
      total: 0,
      idEstado: 1
    });
  }

  private updateDateValidators(): void {
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
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSumbmit(): void {
    console.log('🔍 DEBUG - Form status:', this.reservaForm.status);
    console.log('🔍 DEBUG - Form values:', this.reservaForm.value);

    if (this.reservaForm.valid) {
      const formValue = this.reservaForm.value;
      
      // CONVERSIÓN EXPLÍCITA
      const reservaData: ReservaRequest = {
        id: formValue.id,
        idHuesped: Number(formValue.idHuesped),
        idHabitacion: Number(formValue.idHabitacion),
        fechaEntrada: formValue.fechaEntrada,
        fechaSalida: formValue.fechaSalida,
        noches: Number(formValue.noches),
        total: Number(formValue.total),
        idEstado: formValue.idEstado
            };

      console.log('🔍 DEBUG - Reserva data final:', reservaData);

      // Validación adicional de fechas
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

       const habitacionReservada = this.validarHabitacionReservada(
      reservaData.idHabitacion,
      reservaData.fechaEntrada,
      reservaData.fechaSalida,
      this.isEditMode ? reservaData.id || null : null
    );

   

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
          },
          error: (err) => {
            console.error('Error al actualizar reserva:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar la reserva'
            });
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
          },
          error: (err) => {
            console.error('Error al crear reserva:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo crear la reserva'
            });
          }
        });
      }
    } else {
      this.showFormErrors();
    }
  }




    checkIn(reserva: ReservaResponse): void {
    Swal.fire({
      title: 'Confirmar Check-In',
      html: `¿Estás seguro de realizar el check-in para <strong>${reserva.Huesped.nombre} ${reserva.Huesped.apellido}</strong>?<br>
             Habitación: <strong>${reserva.Habitacion.numero}</strong><br>
             Fecha de entrada: <strong>${this.formatDateForInput(reserva.fechaEntrada)}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, hacer Check-in',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0dcaf0'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actualizarEstadoReserva(reserva.id, 2, 'Check-in realizado exitosamente');
      }
    });
  }

  // CHECK-OUT: En curso → Finalizada
  checkOut(reserva: ReservaResponse): void {
    // Calcular estadía real
    const fechaEntrada = new Date(reserva.fechaEntrada);
    const fechaCheckout = new Date();
    const diffTime = Math.abs(fechaCheckout.getTime() - fechaEntrada.getTime());
    const nochesReales = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const totalReal = nochesReales * reserva.Habitacion.precio;

    Swal.fire({
      title: 'Confirmar Check-Out',
      html: `¿Estás seguro de realizar el check-out para <strong>${reserva.Huesped.nombre} ${reserva.Huesped.apellido}</strong>?<br>
             Habitación: <strong>${reserva.Habitacion.numero}</strong><br>
             Estadía real: <strong>${nochesReales} noches</strong><br>
             Total a cobrar: <strong>$${totalReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, hacer Check-out',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ffc107'
    }).then((result) => {
      if (result.isConfirmed) {
        // Crear objeto ReservaRequest con solo los campos necesarios
        const reservaActualizada: ReservaRequest = {
          id: reserva.id,
          idHuesped: reserva.Huesped.id,
          idHabitacion: reserva.Habitacion.id,
          fechaEntrada: reserva.fechaEntrada,
          fechaSalida: reserva.fechaSalida,
          noches: nochesReales,
          total: totalReal,
          idEstado: 3 // Finalizada
        };
        
        this.reservasService.putReserva(reservaActualizada, reserva.id).subscribe({
          next: (updatedReserva) => {
            const index = this.reservas.findIndex(r => r.id === updatedReserva.id);
            if (index !== -1) this.reservas[index] = updatedReserva;
            
            Swal.fire({
              icon: 'success',
              title: 'Check-out Completado',
              html: `Check-out realizado exitosamente para <strong>${reserva.Huesped.nombre} ${reserva.Huesped.apellido}</strong><br>
                     Total cobrado: <strong>$${totalReal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>`
            });
          },
          error: (err) => {
            console.error('Error al hacer check-out:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo realizar el check-out'
            });
          }
        });
      }
    });
  }

  // MODIFICAR FECHAS (para reservas Confirmadas y En curso)
  modificarFechas(reserva: ReservaResponse): void {
    this.isEditMode = true;
    this.selectedReserva = reserva;
    this.modalText = 'Modificar Fechas de Reserva';
    
    // Solo permitir modificar fechas y estado
    this.reservaForm.patchValue({ 
      id: reserva.id,
      idHuesped: reserva.Huesped.id,
      idHabitacion: reserva.Habitacion.id,
      fechaEntrada: this.formatDateForInput(reserva.fechaEntrada),
      fechaSalida: this.formatDateForInput(reserva.fechaSalida),
      noches: reserva.noches,
      total: reserva.total,
      idEstado: reserva.idEstado
    });
    
    // Deshabilitar campos que no se pueden modificar
    this.reservaForm.get('idHuesped')?.disable();
    this.reservaForm.get('idHabitacion')?.disable();
    
    this.modalInstance.show();
  }

  // CANCELAR RESERVA: Confirmada → Cancelada
  cancelarReserva(reserva: ReservaResponse): void {
    Swal.fire({
      title: 'Cancelar Reserva',
      html: `¿Estás seguro de cancelar la reserva de <strong>${reserva.Huesped.nombre} ${reserva.Huesped.apellido}</strong>?<br>
             Habitación: <strong>${reserva.Habitacion.numero}</strong><br>
             Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Cancelar',
      cancelButtonText: 'Mantener Reserva',
      confirmButtonColor: '#dc3545'
    }).then((result) => {
      if (result.isConfirmed) {
        this.actualizarEstadoReserva(reserva.id, 4, 'Reserva cancelada exitosamente');
      }
    });
  }
  
  // MÉTODO GENERAL PARA ACTUALIZAR ESTADO
  private actualizarEstadoReserva(reservaId: number, nuevoEstado: number, mensajeExito: string): void {
    const reserva = this.reservas.find(r => r.id === reservaId);
    if (!reserva) return;

    // Crear objeto ReservaRequest con solo los campos necesarios
    const reservaActualizada: ReservaRequest = {
      id: reserva.id,
      idHuesped: reserva.Huesped.id,
      idHabitacion: reserva.Habitacion.id,
      fechaEntrada: reserva.fechaEntrada,
      fechaSalida: reserva.fechaSalida,
      noches: reserva.noches,
      total: reserva.total,
      idEstado: nuevoEstado
    };

    this.reservasService.putReserva(reservaActualizada, reservaId).subscribe({
      next: (updatedReserva) => {
        const index = this.reservas.findIndex(r => r.id === updatedReserva.id);
        if (index !== -1) this.reservas[index] = updatedReserva;
        
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: mensajeExito
        });
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el estado de la reserva'
        });
      }
    });
  }












  editReserva(reserva: ReservaResponse): void {
  this.isEditMode = true;
  this.selectedReserva = reserva;
  this.modalText = 'Editando Reserva';
  
  this.updateDateValidators();
  
  // CORREGIDO: Usar los nombres correctos de los campos
  this.reservaForm.patchValue({ 
    id: reserva.id,
    idHuesped: reserva.Huesped, // ← Campo correcto
    idHabitacion: reserva.idhabitacion, // ← Campo correcto
    fechaEntrada: this.formatDateForInput(reserva.fechaEntrada),
    fechaSalida: this.formatDateForInput(reserva.fechaSalida),
    noches: reserva.noches,
    total: reserva.total,
    idEstado: Number(reserva.idEstado)
  });
  
  this.modalInstance.show();
}

  private showDateError(message: string): void {
    Swal.fire({
      icon: 'error',
      title: 'Error en las fechas',
      text: message
    });
  }

  private showFormErrors(): void {
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
          },
          error: (err) => {
            console.error('Error al eliminar reserva:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la reserva'
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
    this.actualizarHabitacionesDisponibles();
  });

  this.reservaForm.get('fechaSalida')?.valueChanges.subscribe(() => {
    this.calcularNochesYTotal();
    this.actualizarHabitacionesDisponibles();
  });

  this.reservaForm.get('idHabitacion')?.valueChanges.subscribe(() => {
    this.calcularNochesYTotal();
  });
}

// Método para actualizar la lista de habitaciones disponibles
actualizarHabitacionesDisponibles(): void {
  const fechaEntrada = this.reservaForm.get('fechaEntrada')?.value;
  const fechaSalida = this.reservaForm.get('fechaSalida')?.value;
  
  // Si ambas fechas están seleccionadas, actualizar la lista de habitaciones
  if (fechaEntrada && fechaSalida) {
    const habitacionesDisponibles = this.getHabitacionesDisponibles(fechaEntrada, fechaSalida);
    
    // Si la habitación actualmente seleccionada ya no está disponible, limpiar la selección
    const idHabitacionActual = this.reservaForm.get('idHabitacion')?.value;
    if (idHabitacionActual && !habitacionesDisponibles.find(h => h.id === idHabitacionActual)) {
      this.reservaForm.patchValue({ idHabitacion: null });
    }
  }
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
      
      const habitacion = this.habitaciones.find(h => h.id === Number(idHabitacion));
      if (habitacion) {
        const total = noches * habitacion.precio;
        
        this.reservaForm.patchValue({
          noches: noches,
          total: total
        }, { emitEvent: false });
      }
    }
  }

 getHabitacionesDisponibles(fechaEntrada: string, fechaSalida: string): HabitacionResponse[] {
  if (!fechaEntrada || !fechaSalida) {
    return this.habitaciones; // Si no hay fechas, mostrar todas
  }

  return this.habitaciones.filter(habitacion => {
    // Verificar si la habitación está reservada en las fechas seleccionadas
    const estaReservada = this.validarHabitacionReservada(
      habitacion.id,
      fechaEntrada,
      fechaSalida
    );
    
    return !estaReservada; // Devolver solo las NO reservadas
  });
}


validarHabitacionReservada(
  idHabitacion: number, 
  fechaEntrada: string, 
  fechaSalida: string, 
  excludeReservaId: number | null = null
): boolean {
  
  // Validaciones básicas
  if (!idHabitacion || !fechaEntrada || !fechaSalida) {
    return false;
  }
  
  const entrada = new Date(fechaEntrada);
  const salida = new Date(fechaSalida);
  
  console.log(`🔍 Validando habitación ${idHabitacion} del ${fechaEntrada} al ${fechaSalida}`);
  
  // Buscar reservas para la misma habitación
  const reservasHabitacion = this.reservas.filter(reserva => {
    // Excluir la reserva actual si estamos editando
    if (excludeReservaId && reserva.id === excludeReservaId) {
      return false;
    }
    // Solo reservas de la misma habitación
    return reserva.Habitacion.id === idHabitacion;
  });
  
  console.log(`📊 Reservas encontradas para habitación ${idHabitacion}:`, reservasHabitacion.length);
  
  // Verificar conflictos de fechas
  for (const reserva of reservasHabitacion) {
    const reservaEntrada = new Date(reserva.fechaEntrada);
    const reservaSalida = new Date(reserva.fechaSalida);
    
    console.log(`📅 Comparando con reserva ${reserva.id}: ${reserva.fechaEntrada} al ${reserva.fechaSalida}`);
    
    // Verificar superposición de fechas
    const hayConflicto = 
      (entrada < reservaSalida && salida > reservaEntrada);
    
    if (hayConflicto) {
      console.warn(`🚫 CONFLICTO: Habitación ${idHabitacion} ya reservada del ${reserva.fechaEntrada} al ${reserva.fechaSalida}`);
      return true; // Está reservada
    }
  }
  
  console.log(`✅ DISPONIBLE: Habitación ${idHabitacion} libre del ${fechaEntrada} al ${fechaSalida}`);
  return false; // Está disponible
}
 private formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }



  // MAP CORREGIDO - Usar números como keys
  reservaMap: { [key: number]: string } = {
    1: 'Confirmada',
    2: 'En curso',
    3: 'Finalizada',
    4: 'Cancelada'
  };
}