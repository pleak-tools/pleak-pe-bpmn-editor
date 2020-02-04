import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from './editor.component';
import { EditorService } from './editor.service';
import { LeakageDetectionComponent } from './leakage-detection/leakage-detection.component';
import { AuthService } from '../auth/auth.service';
import { HttpClientModule } from '@angular/common/http';
import { LeaksWhenAnalysisComponent } from './leaks-when-analysis/leaks-when-analysis.component';
import { ScriptPanelComponent } from './leaks-when-analysis/script-panel/script-panel.component';
import { PolicyPanelComponent } from './leaks-when-analysis/policy-panel/policy-panel.component';
import { ScriptPolicyModalComponent } from './leaks-when-analysis/script-policy-modal/script-policy-modal.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        HttpClientModule,
        FormsModule,
        CodemirrorModule
    ],
    declarations: [
      EditorComponent,
      LeakageDetectionComponent,
      LeaksWhenAnalysisComponent,
      ScriptPanelComponent,
      PolicyPanelComponent,
      ScriptPolicyModalComponent
    ],
    providers: [EditorService, AuthService],
    exports: [EditorComponent]
})
export class EditorModule { }
