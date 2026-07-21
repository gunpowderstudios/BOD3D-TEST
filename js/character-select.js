(function(){
 const logo=document.getElementById('heroSelectLogo');
 if(!logo)return;

 const candidates=[
  './assets/ui/bod3d-logo.png?v=10.58',
  'assets/ui/bod3d-logo.png?v=10.58'
 ];
 let candidateIndex=0;

 logo.addEventListener('load',()=>{
  console.info('BOD3D logo loaded:',logo.currentSrc||logo.src);
 });

 logo.addEventListener('error',()=>{
  candidateIndex++;
  if(candidateIndex<candidates.length){
   console.warn('BOD3D logo failed; trying:',candidates[candidateIndex]);
   logo.src=candidates[candidateIndex];
  }else{
   console.error(
    'BOD3D logo could not be found. Expected GitHub file: assets/ui/bod3d-logo.png'
   );
   logo.style.display='none';
  }
 });
})();


