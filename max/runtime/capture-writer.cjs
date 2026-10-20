// max-api is provided by Node for Max; no npm installation is required inside Max.
const maxApi=require('max-api');
const {saveCapture}=require('./capture-file.cjs');
maxApi.addHandler('savecapture',async(path,source)=>{
 try{await saveCapture(path,source);maxApi.outlet('status','Capture saved. Import it into the studio.');}
 catch(error){maxApi.outlet('status','Capture export error: '+error.message);}
});
