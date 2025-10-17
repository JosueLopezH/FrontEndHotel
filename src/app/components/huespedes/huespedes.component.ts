        import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
        import { FormBuilder, FormGroup, Validators } from '@angular/forms';
        import Swal from 'sweetalert2';
        import { AuthService } from '../../services/auth.service';
        import { Roles } from '../../constants/constanst';
        import { HuespedResponse } from '../../models/Huesped.models';
        import { HuespedesService } from '../../services/huespedes.service';

        declare var bootstrap: any;

        @Component({
        selector: 'app-huespedes',
        standalone: false,
        templateUrl: './huespedes.component.html',
        styleUrls: ['./huespedes.component.css']
        })
        export class HuespedesComponent implements OnInit, AfterViewInit {

        huespedes: HuespedResponse[] = [];
        huespedForm: FormGroup;
        modalText: string = 'Nuevo Huesped';
        selectedHuesped: HuespedResponse | null = null;
        isEditMode: boolean = false;
        showActions: boolean = false;

        @ViewChild('huespedModalRef') huespedModalEl!: ElementRef;
        private modalInstance!: any;

        constructor(
            private huespedesService: HuespedesService,
            private formBuilder: FormBuilder,
            private authService: AuthService
        ) {
            // FORMGROUP CORREGIDO - Campos numéricos como null
            this.huespedForm = this.formBuilder.group({
            id: [null],
            nombre: ['', [
                Validators.required, 
                Validators.maxLength(30), 
                Validators.pattern(/^(?!\s*$).+/),
                Validators.minLength(2)  // ← AGREGADO: mínimo 2 caracteres
            ]],
            apellido: ['', [
                Validators.required, 
                Validators.maxLength(30), 
                Validators.pattern(/^(?!\s*$).+/),
                Validators.minLength(2)  // ← AGREGADO: mínimo 2 caracteres
            ]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
            telefono: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[0-9]+$/)]],
            idDocumento: [null, [Validators.required]],  // ← CORREGIDO: null en lugar de ''
            nacionalidad: ['', [Validators.required, Validators.maxLength(30)]],
            });
        }

        ngOnInit(): void {
            this.listarHuespedes();
            if (this.authService.hasRole(Roles.ADMIN)) {
            this.showActions = true;
            }
        }

        ngAfterViewInit(): void {
            this.modalInstance = new bootstrap.Modal(this.huespedModalEl.nativeElement, { keyboard: false });

            this.huespedModalEl.nativeElement.addEventListener('hidden.bs.modal', () => {
            this.resetForm();
            });
        }

        listarHuespedes(): void {
            this.huespedesService.getHuespedes().subscribe({
            next: resp => {
                this.huespedes = resp;
                console.log('🔍 HUÉSPEDES - Datos cargados:', this.huespedes);
            },
            error: err => console.error('Error al listar huespedes', err)
            });
        }

        toggleForm(): void {
            this.resetForm();
            this.modalText = 'Nuevo Huesped';
            this.modalInstance.show();
        }

        resetForm(): void {
            this.isEditMode = false;
            this.selectedHuesped = null;
            // RESET CORREGIDO - Valores por defecto apropiados
            this.huespedForm.reset({
            id: null,
            nombre: '',
            apellido: '',
            email: '',
            telefono: '',
            idDocumento: null,  // ← CORREGIDO: null en lugar de string vacío
            nacionalidad: ''
            });
        }

        editHuesped(huesped: HuespedResponse): void {
            this.isEditMode = true;
            this.selectedHuesped = huesped;
            this.modalText = 'Editando Huesped ' + huesped.nombre;
            
            // PATCH VALUE CORREGIDO - Asegurar tipos correctos
            this.huespedForm.patchValue({ 
            ...huesped,
            idDocumento: Number(huesped.idDocumento)  // ← Asegurar que sea número
            });
            
            this.modalInstance.show();
        }

        onSumbmit(): void {
            console.log('🔍 HUÉSPED - Form status:', this.huespedForm.status);
            console.log('🔍 HUÉSPED - Form values:', this.huespedForm.value);
            
            // DEBUG: Mostrar errores específicos
            if (this.huespedForm.invalid) {
            console.log('🔍 HUÉSPED - Formulario inválido. Errores:');
            Object.keys(this.huespedForm.controls).forEach(key => {
                const control = this.huespedForm.get(key);
                if (control?.invalid) {
                console.log(`  ${key}:`, control.errors, 'Value:', control.value);
                }
            });
            }

            if (this.huespedForm.valid) {
            const formValue = this.huespedForm.value;
            
            // CONVERSIÓN EXPLÍCITA de campos numéricos
            const huespedData = {
                ...formValue,
                idDocumento: Number(formValue.idDocumento)  // ← Conversión explícita
            };

            console.log('🔍 HUÉSPED - Datos a enviar:', huespedData);

            if (this.isEditMode) {
                this.huespedesService.putHuesped(huespedData, huespedData.id).subscribe({
                next: updatedHuesped => {
                    const index = this.huespedes.findIndex(h => h.id === updatedHuesped.id);
                    if (index !== -1) this.huespedes[index] = updatedHuesped;
                    Swal.fire({
                    icon: 'success',
                    title: 'Huesped Actualizado',
                    text: 'El huesped ha sido actualizado exitosamente'
                    });
                    this.resetForm();
                    this.modalInstance.hide();
                },
                error: err => {
                    console.error('Error al actualizar huésped:', err);
                    this.handleError(err);
                }
                });
            } else {
                this.huespedesService.postHuesped(huespedData).subscribe({
                next: newHuesped => {
                    this.huespedes.push(newHuesped);
                    Swal.fire({
                    icon: 'success',
                    title: 'Huesped Registrado',
                    text: 'El huesped ha sido registrado exitosamente'
                    });
                    this.resetForm();
                    this.modalInstance.hide();
                },
                error: err => {
                    console.error('Error al crear huésped:', err);
                    this.handleError(err);
                }
                });
            }
            } else {
            Swal.fire({
                icon: 'error',
                title: 'Formulario inválido',
                text: 'Por favor complete todos los campos correctamente'
            });
            }
        }

        private handleError(err: any): void {
            let errorMessage = 'Error al procesar la solicitud';
            
            if (err.error && err.error.mensaje) {
            errorMessage = err.error.mensaje;
            } else if (err.error && err.error.message) {
            errorMessage = err.error.message;
            } else if (err.message) {
            errorMessage = err.message;
            }
            
            Swal.fire({
            icon: 'error',
            title: 'Error',
            html: errorMessage
            });
        }

        deleteHuesped(huesped: HuespedResponse): void {
            Swal.fire({
            title: '¿Estás seguro de eliminar este huesped?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
            }).then(result => {
            if (result.isConfirmed && huesped.id) {
                this.huespedesService.deleteHuesped(huesped.id).subscribe({
                next: () => {
                    this.huespedes = this.huespedes.filter(h => h.id !== huesped.id);
                    Swal.fire({
                    icon: 'success',
                    title: 'Huesped Eliminado',
                    text: 'El huesped ha sido eliminado correctamente'
                    });
                },
                error: err => {
                    console.error('Error al eliminar huésped:', err);
                    this.handleError(err);
                }
                });
            }
            });
        }

        // MAP CORREGIDO - Usar números como keys
        documentoMap: { [key: number]: string } = {
    1: 'INE',
    2: 'Pasaporte'
    };

        // MÉTODOS AUXILIARES PARA MOSTRAR ERRORES EN TEMPLATE
        getNombreError(): string {
            const errors = this.huespedForm.get('nombre')?.errors;
            if (errors?.['required']) return 'El nombre es requerido';
            if (errors?.['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
            if (errors?.['pattern']) return 'El nombre no puede estar vacío';
            return '';
        }

        getApellidoError(): string {
            const errors = this.huespedForm.get('apellido')?.errors;
            if (errors?.['required']) return 'El apellido es requerido';
            if (errors?.['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
            if (errors?.['pattern']) return 'El apellido no puede estar vacío';
            return '';
        }

        getEmailError(): string {
            const errors = this.huespedForm.get('email')?.errors;
            if (errors?.['required']) return 'El email es requerido';
            if (errors?.['email']) return 'El formato del email es inválido';
            return '';
        }

        getTelefonoError(): string {
            const errors = this.huespedForm.get('telefono')?.errors;
            if (errors?.['required']) return 'El teléfono es requerido';
            if (errors?.['pattern']) return 'Solo se permiten números';
            return '';
        }
        }