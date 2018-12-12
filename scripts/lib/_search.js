// Search for products.
function _search(text){
  window.location.href = `/search?page=1&search=${text}`;
}
export default _search;