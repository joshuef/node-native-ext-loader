var path = require("path");

module.exports = function(content) {
  const defaultConfig = {
    basePath: [],
    checkResourcesPath : false,
    rewritePath: undefined,
    emit: true
  };

  const config = Object.assign(defaultConfig, this.query);
  const fileName = path.basename(this.resourcePath);

  if (config.emit) {
    if (this.emitFile) {
      this.emitFile(fileName, content, false);
    } else {
      throw new Error("emitFile function is not available");
    }
  }

  this.addDependency(this.resourcePath);

  if (config.rewritePath) {
    let filePath;

    if (config.rewritePath === "./" || config.rewritePath === ".\\") {
      filePath = JSON.stringify(config.rewritePath + fileName);
    } else {
      filePath = JSON.stringify(path.join(config.rewritePath, fileName));
    }


    return (
      "try { global.process.dlopen(module, " +
      filePath +
      "); } " +
      "catch(exception) { throw new Error('Cannot open ' + " +
      filePath +
      " + ': ' + exception); };"
    );
  } else {
    const filePathArray = config.basePath.concat(fileName);
    const filePath = JSON.stringify(filePathArray).slice(1, -1);

    return (
		`
        const remote = require('electron').remote;
        const path = require('path');
        const checkResourcesPath = ${ config.checkResourcesPath};
        let filePath = path.resolve(__dirname, ${filePath} );

        if( checkResourcesPath ){ filePath = path.resolve( process.resourcesPath, "${fileName}" )}

        if( remote && remote.process.env.LIB_PATH ){ filePath = path.resolve( global.process.env.LIB_PATH, "${fileName}" )}
        try { global.process.dlopen(module, filePath); }
        catch(exception) { throw new Error('Cannot open ' + filePath + ': ' + exception); };
        `
    );
  }
};

module.exports.raw = true;
