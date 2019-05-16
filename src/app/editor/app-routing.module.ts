import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EditorComponent } from './editor.component';
import { ExportComponent } from './export/export.component';
import { EditorModule } from './editor.module';

const routes: Routes = [
  {
    path: 'pe-bpmn-editor/:id', component: EditorModule,
  },
  {
    path: 'pe-bpmn-editor/viewer/:id', component: EditorModule,
  },
  {
    path: 'pe-bpmn-editor/export/:id/:export_type', component: ExportComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule { }
