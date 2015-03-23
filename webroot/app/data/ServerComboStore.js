
Ext.define('vcube.data.ServerComboStore',{
	
	extend: 'Ext.data.Store',

	fields: ['value','display'],
	
	autoload: false,
	remoteSort: false,
	remoteFilter: false,
	pageSize: 0,
	defaultPageSize: 0,
	isServerStore: true,
	
	/* For vbox enum conversion */
	conversionFn: null,
	
	/* Extra params to be passed via proxy */
	extraParams: {},
	
	// Manipulate incoming records. This may be able to be performed
	// on a load listener, but combo boxes also listen for load
	loadRecords: function(records, options) {
	
		var self = this;
		Ext.each(records, function(r) {
			r.set('value',r.raw);
			r.set('display', self.conversionFn(r.raw));
		});
		
		this.callParent(arguments);
				
	},
	
	
	proxy: {
		type: 'vcubeAjax',
		noCache: false,
		extraParams: {},
    	reader: {
    		type: 'vcubeJsonReader'
    	}
	},
	
	
	
	
	constructor: function(options) {
		
		// If ignoreNull is true, add filter
		if(options && options.url) {
			this.proxy.url = options.url;
		}
		
		this.conversionFn = options.conversionFn || function(v) {return v;};
		
		this.callParent(arguments);
		
		// Update extra params before any request is made
		this.on('beforeload', function(store) {
			
			Ext.apply(this.getProxy().extraParams, this.extraParams);
			
		}, this);
		
	},
	
	setServer: function(server_id) {
		
		this.updateProxyParams({'connector':server_id});
		
		// Load when server is set
		this.load();
	},
	
	updateProxyParams: function(params) {
		Ext.apply(this.extraParams, params);
	}
	
});
