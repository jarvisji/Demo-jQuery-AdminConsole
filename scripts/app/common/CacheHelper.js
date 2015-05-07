/**
 * Helper functions to  cache data.
 */
define(function() {

	return {
		/**
		 * cache updata
		 */
		deleteCacheData : function(CacheData, attr) {
			for (value in CacheData) {
				if (CacheData[value]["id"] == attr) {
					CacheData.splice(value, 1);
				}
			}
			return CacheData;
		},

		updataCacheData : function(CacheData, attr, setArrt, cont) {
			for (value in CacheData) {
				if (CacheData[value]["id"] == attr) {
					CacheData[value][setArrt] = cont;
				}
			}
			return CacheData;
		}
	};
});
