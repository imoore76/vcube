
Ext.define('vcube.data.VboxEnumStore',{
	
	extend: 'vcube.data.ServerComboStore',

	proxy: {
		type: 'vcubeAjax',
		url: 'vbox/vboxGetEnumerationMap',
		extraParams: {'KeysOnly': true},
    	reader: {
    		type: 'vcubeJsonReader'
    	}
	},
	
	constructor: function(options) {
		
		// If ignoreNull is true, add filter
		if(options && options.ignoreNull) {
			this.filters = [function(r){
				return (r.get('value') != "Null");
			}];
		}
		
		
		this.callParent(arguments);
		this.extraParams = {'class':options.enumClass,connector:options.server_id};
		
	}
	
});
