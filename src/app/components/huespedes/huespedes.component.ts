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
        this.huespedForm = this.formBuilder.group({
        id: [null],
        nombre: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^(?!\s*$).+/)]],
        apellido: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^(?!\s*$).+/)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
        telefono: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[0-9]+$/)]],
        idDocumento: ['', [Validators.required, Validators.maxLength(30)]],
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
        next: resp => this.huespedes = resp,
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
        this.huespedForm.reset();
    }

    editHuesped(huesped: HuespedResponse): void {
        this.isEditMode = true;
        this.selectedHuesped = huesped;
        this.modalText = 'Editando Huesped ' + huesped.nombre;
        this.huespedForm.patchValue({ ...huesped });
        this.modalInstance.show();
    }

    onSumbmit(): void {
        if (this.huespedForm.valid) {
        const huespedData = this.huespedForm.value;

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
            }
            });
        }
        }
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
            }
            });
        }
        });
    }

    }
