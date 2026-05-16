const KEY='sirt_case_v1';
export function saveCase(data){localStorage.setItem(KEY, JSON.stringify(data));}
export function loadCase(){const raw=localStorage.getItem(KEY); return raw?JSON.parse(raw):null;}
export function exportJSON(data){
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sirt_case.json';a.click();
}
export function importJSON(file){return file.text().then(JSON.parse);}
