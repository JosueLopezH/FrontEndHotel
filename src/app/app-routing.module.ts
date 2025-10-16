import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HabitacionesComponent } from './components/habitaciones/habitaciones.component';
import { HuespedesComponent } from './components/huespedes/huespedes.component';
import { ReservasComponent } from './components/reservas/reservas.component';
import { LoginComponent } from './components/login/login.component';

const routes: Routes = [
  {path:'', redirectTo: '/login', pathMatch: 'full'},
  {path:'login', component: LoginComponent},
{path: 'dashboard', component: DashboardComponent, children:[
  {path: 'habitaciones', component: HabitacionesComponent},
  {path: 'huespedes', component: HuespedesComponent},
  {path: 'reservas', component: ReservasComponent},

 ]},
 {path: '**', redirectTo: 'dashboard'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
