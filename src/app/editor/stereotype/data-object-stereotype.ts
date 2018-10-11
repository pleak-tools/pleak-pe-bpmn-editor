import { DataObjectHandler } from "../handler/data-object-handler";
import { Stereotype } from "./stereotype";


export class DataObjectStereotype extends Stereotype {

  constructor(title: String, dataObjectHandler: DataObjectHandler) {
    super(title, dataObjectHandler);

    this.dataObject = dataObjectHandler.dataObject;
    this.dataObjectHandler = dataObjectHandler;
  }

  dataObject: any;
  dataObjectHandler: DataObjectHandler;

  /** Wrappers to access dataObjectHandler functions*/
  getDataObjectHandlerByDataObjectId(dataObjectId: String) {
    return this.dataObjectHandler.getDataObjectHandlerByDataObjectId(dataObjectId);
  }

}