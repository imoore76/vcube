Ext.define('vcube.form.field.serverstorecombo', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.serverstorecombo',
    
	displayField: 'display',
	valueField: 'value',
	queryMode: 'local',

	_serverSet: false,
	
    initComponent: function() {
    	this.callParent(arguments);
    	this.on('beforerender', function(cbo) {
    		
    		if(cbo._serverSet) return;
    		cbo._serverSet = true;
    		
    		cbo.getStore().setServer(cbo.up('.window').serverId);
		});
    }
});
