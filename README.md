# Pleak PE-BPMN & Leaks-When editor

This editor provides GUI for SQL leaks-when analyzer, BPMN leaks-when analyzer and leakage detection analysis tool. Also, it provides Simple disclosure analysis, Data dependencies analysis and Extended simple disclosure analysis (also used for Simple leaks-when analysis, combination of Extended simple disclosure analysis and SQL leaks-when analysis).

## Prerequisites

You need to locate pleak-pe-bpmn-editor, [pleak-backend](https://github.com/pleak-tools/pleak-backend), [pleak-frontend](https://github.com/pleak-tools/pleak-frontend), [pleak-leakage-detection-analysis](https://github.com/pleak-tools/pleak-leakage-detection-analysis), [pleak-leaks-when-analysis](https://github.com/pleak-tools/pleak-leaks-when-analysis) and [pleak-leaks-when-ast-transformation](https://github.com/pleak-tools/pleak-leaks-when-ast-transformation) directories all in the same directory. Specify names for the first three modules in the config.json file.
Read more from sub-repositories how to build each module.

## Build

To build the editor you need: NodeJS with npm installed.

To install all project dependencies execute `npm install`.

Execute `npm run build` to build the project.

## Using

You can use the editor for each model from the Action menu next to the model on Files page (of frontend) or from the URL: http://localhost:8000/pe-bpmn-editor/id (id of the model).

## License

MIT