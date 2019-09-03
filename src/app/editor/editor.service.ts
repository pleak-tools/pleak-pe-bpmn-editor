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
  modelId: number;

  public analyze: Function;

  loadModel(content, canEdit, modelId) {
    this.canEdit = canEdit;
    this.modelId = modelId;
    if (content) {
      this._newModel.next(content);
      this._model.next(content);
    }
  }

  updateModel(content) {
    if (content) {
      this._model.next(content);
    }
  }

  getModel() {
    return this._model.getValue();
  }
}
