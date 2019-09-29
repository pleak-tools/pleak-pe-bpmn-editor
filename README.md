# Pleak PE-BPMN editor

## Prerequisites

You need to locate [pleak-backend](https://github.com/pleak-tools/pleak-backend), [pleak-frontend](https://github.com/pleak-tools/pleak-frontend), [pleak-leakage-detection-analysis](https://github.com/pleak-tools/pleak-leakage-detection-analysis) and pleak-pe-bpmn-editor directories all in the same directory. Specify names for the first three modules in the config.json file.
Read more from sub-repositories how to build each module.

## Build

To build an app you need: NodeJS with npm installed.

To install all project dependencies execute `npm install`.

Execute `npm run build` to build the project.

## Using

You can use the editor for each model from the Action menu next to the model on Files page (of frontend) or from the URL: http://localhost:8000/pe-bpmn-editor/id (id of the model).

## License

MIT