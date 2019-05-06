import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { EditorComponent } from './editor/editor.component';

import { AuthService } from './auth/auth.service';
import { AppRoutingModule } from './editor/app-routing.module';
import { ExportComponent } from './editor/export/export.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    ExportComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AppRoutingModule
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
