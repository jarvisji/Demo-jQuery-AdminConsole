define(function() {

	return {
		ts2LocalDateTime : function(timestamp) {
			var date = new Date(timestamp);
			return date.toLocaleDateString() + " " + date.toLocaleTimeString();
		},
		ts2LocalDate : function(timestamp) {
			var date = new Date(timestamp);
			return date.toLocaleDateString();
		}
	}
});
