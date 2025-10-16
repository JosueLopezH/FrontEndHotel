import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HabitacionesComponent } from './components/habitaciones/habitaciones.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavbarComponent } from './components/common/navbar/navbar.component';
import { FooterComponent } from './components/common/footer/footer.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HuespedesComponent } from './components/huespedes/huespedes.component';
import { ReservasComponent } from './components/reservas/reservas.component';
import { LoginComponent } from './components/login/login.component';

@NgModule({
  declarations: [
    AppComponent,
    HabitacionesComponent,
    HuespedesComponent,
    ReservasComponent,
    LoginComponent,
    DashboardComponent,
    NavbarComponent,
    FooterComponent 
  ],
  imports: [
    BrowserModule, 
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
