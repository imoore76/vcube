Ext.define('vcube.store.Tasks',{
	extend: 'Ext.data.Store',
	autoload: false,
	remoteSort: true,
	remoteFilter: true,
	proxy: {
		type: 'vcubeAjax',
		url: 'tasklog/getTasks',
		reader: {
			type: 'vcubeJsonReader'
		}
	},
	fields : [
      {name: 'id', type: 'int'},
      {name: 'name', type: 'string'},
      {name: 'machine', type: 'string'},
      {name: 'user', type: 'string'},
      {name: 'status', type: 'int'},
      {name: 'details', type: 'string'},
      {name: 'connector', type: 'int'},
      {name: 'progress', type: 'auto'},
      {name: 'category', type: 'int'},
      {name: 'started', type: 'date', dateFormat: 'Y-m-d H:i:s'},
      {name: 'completed', type: 'date', dateFormat: 'Y-m-d H:i:s'}
	]
});

