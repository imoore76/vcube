Ext.define('vcube.Action',{
	
	extend: 'Ext.Action',
	
	// Base icon string
	iconBase: null,
	
	// Modify incoming components
	addComponent : function(cmp) {
		
		// this is a button
		if(!cmp.isAction) {
			
			// Change icon size based on scale of button
			if(cmp.scale && cmp.scale != 'small') {
				cmp.icon = 'images/vbox/' + this.iconBase +  '_' +
					(cmp.scale == 'medium' ? '22' : '32') + 'px.png';
				
			} else {
				cmp.icon = this.initialConfig.icon;				
			}
			
			cmp.text = this.initialConfig.text;
			cmp.handler = this.initialConfig.handler;
			cmp.scope = this.initialConfig.scope;
			
			if(this.enabled_test) cmp.setDisabled(true);

		}
		
		this.callParent(arguments);
		
    },

    // Enable / disable action based on test
	setEnabledTest: function() {
		this.setDisabled(this.enabled_test && !this.enabled_test.apply(this, arguments));
	},
	
	constructor: function(config, itemId) {
		
		this.enabled_test = config.enabled_test;
		
		config.itemId = itemId;
		
		this.iconBase = config.icon;
		
		//
		config.icon = 'images/vbox/' + config.icon + '_16px.png';

		this.callParent(arguments);

	}
});