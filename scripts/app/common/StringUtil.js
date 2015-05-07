define(function() {
	return {
		escapeHTML : function(str) {
			str = String(str).replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
			return str;
		},
		unescapeHTML : function(str) {
			str = String(str).replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
			return str;
		}
	};
});
