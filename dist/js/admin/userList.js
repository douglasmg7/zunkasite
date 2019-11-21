'use strict';

// Brasilian months names.
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Search for products.
function _search(text){
  window.location.href = `/all?page=1&search=${text}`;
}

// Vue.
var app = new Vue({
	el: '#app',
	data: {
		// All users from search.
		users: users,
        // Total users on system.
        totalUsers: totalUsers,
		// Text for search orders.
		searchUsers: '',
	},
	methods: {
		getUsers(){
			axios.get(`/admin/api/users?&search=${this.searchUsers}`, { headers: { 'csrf-token' : csrfToken } })
			.then((res)=>{
				this.users = res.data.users;
			})
			.catch((err)=>{
				console.error(`Getting users. ${err}`);
			});
		},    
	}
});
