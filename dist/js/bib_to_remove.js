function ready(cb){
  // Check if the DOMContentLoaded has already been completed.
  if (document.readyState !== 'loading') {
    cb();
  } else {
    document.addEventListener('DOMContentLoaded', cb);
  }
};