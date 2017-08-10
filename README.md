# Pleak PE-BPMN editor

## Build

To build an app you need: NodeJS with npm installed.

To install all project dependencies execute `npm install`.

Execute `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Using

You will need to have [pleak-backend](https://github.com/pleak-tools/pleak-backend), [pleak-frontend](https://github.com/pleak-tools/pleak-frontend) and pleak-pe-bpmn-editor directories all in the same directory and their names specified in the config.json file.
You can use the editor for each model from the Action menu next to the model on Files page (of front-end) or from the URL: http://localhost:8000/pe-bpmn-editor/id (id of the model).

## License

MIT