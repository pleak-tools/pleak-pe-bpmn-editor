import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class EditorService {

  private _model: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  model: Observable<string | null> = this._model.asObservable();

  private _newModel: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  newModel: Observable<string | null> = this._newModel.asObservable();

  canEdit = false;
  modelId: string;

  public analyze: Function;

  loadModel(content: any, canEdit: boolean, modelId: string): void {
    this.canEdit = canEdit;
    this.modelId = modelId;
    if (content) {
      this._newModel.next(content);
      this._model.next(content);
    }
  }

  updateModel(content: any): void {
    if (content) {
      this._model.next(content);
    }
  }

  getModel(): any {
    return this._model.getValue();
  }
}
