Ext.define('vcube.form.field.icon', {
	extend: 'Ext.form.FieldContainer',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.iconfield',
    
	layout: 'hbox',
	margin: '2 0 0 0',
	padding: 0,
	border: false,
	
	fieldLabel: 'Icon',
	
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	return this.iconfield.getValue();
    },
    
    setValue: function(val) {
    	this.iconfield.setValue(val);
    },

    
    initComponent: function() {
    	
    	
    	var txtcfg = {
    		flex: 1,
    		submitValue: false,
			plugins: [{
				ptype: 'fieldhelptext',
				text: 'Full or relative URL of an image'
			}],
    		listeners: {
    			change: function(i, val) {
    				if(Ext.Array.contains(['jpg','png','jpeg','gif'], val.toString().split('.').pop().toLowerCase()))
    					this.iconimg.setSrc(val);
    			},
    			scope: this
    		}
		};
    	
    	this.iconfield = Ext.create('Ext.form.field.Text', txtcfg);
    	
    	this.iconimg = Ext.create('Ext.Img', {
    		src: 'images/vbox/blank.gif',
    		height: 18,
    		width: 18,
    		margin: '2 0 0 4'    		
    	});
    	
    	this.items = [this.iconfield, this.iconimg];
    	
    	this.callParent(arguments);
    }
    
});
