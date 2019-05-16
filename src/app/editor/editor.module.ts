import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { EditorService } from './editor.service';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [EditorComponent],
    providers: [EditorService],
    exports: [EditorComponent]
})
export class EditorModule { }
