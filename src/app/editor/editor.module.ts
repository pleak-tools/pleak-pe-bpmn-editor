import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { EditorService } from './editor.service';
import { LeakageDetectionComponent } from './leakage-detection/leakage-detection.component';
import { AuthService } from '../auth/auth.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule
    ],
    declarations: [
      EditorComponent,
      LeakageDetectionComponent
    ],
    providers: [EditorService, AuthService],
    exports: [EditorComponent]
})
export class EditorModule { }
