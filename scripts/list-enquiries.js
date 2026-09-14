'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
async function main(){
 const directory=path.join(__dirname,'..','private','enquiries');
 let files;try{files=await fs.readdir(directory);}catch(error){if(error.code==='ENOENT')return console.log('No enquiries yet.');throw error;}
 const records=[];
 for(const file of files.filter(f=>f.endsWith('.json'))){const {enquiry}=JSON.parse(await fs.readFile(path.join(directory,file),'utf8'));records.push({reference:enquiry.id,kind:enquiry.kind,name:enquiry.name,email:enquiry.email,occasion:enquiry.occasion,date:enquiry.date,status:enquiry.status,referenceImages:(enquiry.referenceImages||[]).map(image=>image.file).join(', ')});}
 console.table(records);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
