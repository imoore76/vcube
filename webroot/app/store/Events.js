Ext.define('vcube.store.Events',{
	extend: 'Ext.data.Store',
	autoload: false,
	remoteSort: true,
	proxy: {
		type: 'vcubeAjax',
		url: 'eventlog/getEvents',
    	reader: {
    		type: 'vcubeJsonReader'
    	}
	},
	fields : [
	   {name: 'name', type: 'string'},
	   {name: 'severity', type: 'int'},
	   {name: 'details', type: 'string'},
	   {name: 'machine', type: 'string'},
	   {name: 'connector', type: 'int'},
	   {name: 'category', type: 'int'},
	   {name: 'time', type: 'date', dateFormat: 'Y-m-d H:i:s'}
	]
	
});
