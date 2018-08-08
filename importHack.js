'use strict';//@note so tired of .mjs files (using this until switch to deno)
const
fs=require('fs'),
config=
{
    imports:/import \{([^}]+)} from ('[^']+');/,
    exports:/export \{([^}]+)};/
},
promisify=function (func,...args)
{
    return new Promise(function(pass,fail)
    {
        func(...args,(err,data)=>err?fail(err):pass(data));
    });
},
read=(...args)=>promisify(fs.readFile,...args);
//@note these paths are relative file using this module, hence urlPrefix
module.exports=function(urlPrefix='')//load dependencies in & assemble them in new fxn
{
    const 
    promises=['chant.js','chant.util.js']
    .map(x=>urlPrefix+x)
    .map(x=>read(x,'utf-8'));
    return Promise.all(promises)
    .then(function(files)
    {
        const
        {imports,exports}=config,
        [rawChant,rawUtil]=files,
        util=rawUtil.replace(exports,''),
        chant=rawChant.replace(exports,'return {chant,util};');
        return (new Function(chant.replace(imports,util)))();
    });
};