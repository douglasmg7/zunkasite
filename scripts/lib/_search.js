// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}
export default _search;