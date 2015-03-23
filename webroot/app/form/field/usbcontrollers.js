Ext.define('vcube.form.field.usbcontrollers', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.usbcontrollersfield',
    combineErrors: true,
    border: false,
    msgTarget: 'side',
    submitFormat: 'c',
    
    height:56,
    
    defaults: {},
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	var controllers = [];
    	if(this.ohciCheckbox.getValue() == 1) {
    		controllers.push({"type": "OHCI", "name": "OHCI"});
    	}
    	if(this.ehciCheckbox.getValue() == 1) {
    		controllers.push({"type": "EHCI", "name": "EHCI"});
    	}
    	return controllers;
    },
    
    setValue: function(val) {
    	this.ohciCheckbox.setValue(0);
    	this.ehciCheckbox.setValue(0);
    	if(!val) val = [];
    	for(var i = 0; i < val.length; i++) {
    		if(val[i].type == "OHCI") this.ohciCheckbox.setValue(1);
    		else this.ehciCheckbox.setValue(1)
    	}
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.ohciCheckbox = Ext.create('Ext.form.field.Checkbox',{
    		boxLabel: 'Enable USB Controller',
    		inputValue: 1,
    		submitValue: false,
    		listeners: {
    			change: function(cb, val) {
    				this.ehciCheckbox.setDisabled(!val);
    				var filters = this.up('.panel').down('.usbfiltersfield').childComponent;
    				if(filters) filters.setDisabled(!val);
    			},
    			scope: this
    		}    		
    	});
    	
    	this.ehciCheckbox = Ext.create('Ext.form.field.Checkbox',{
    		inputValue: 1,
    		submitValue: false,
    		disabled: true,
    		fieldLabel: ' ',
    		labelSeparator: '',
    		labelWidth: 20,
    		boxLabel: 'Enable USB 2.0 (EHCI) Controller'
    	});

    	this.childComponent = Ext.create('Ext.panel.Panel',{
    	    layout: 'form',
    	    border: false,
    		bodyStyle: { background: 'transparent' },
    		defaults: {
        		border: false,
        		bodyStyle: { background: 'transparent' }			
    		},
    		items: [this.ohciCheckbox, this.ehciCheckbox]
    	});
    	
	    
	    this.callParent(arguments);
	    
	    this.on('destroy', function() { Ext.destroy(this.childComponent); }, this);

    },
    
    // Generates the child component markup and let Ext.form.field.Base handle the rest
    getSubTplMarkup: function() {
        // generateMarkup will append to the passed empty array and return it
    	// but we want to return a single string
        return Ext.DomHelper.generateMarkup(this.childComponent.getRenderTree(), []).join('');
    },
    
    // Regular containers implements this method to call finishRender for each of their
    // child, and we need to do the same for the component to display smoothly
    finishRenderChildren: function() {
        this.callParent(arguments);
        this.childComponent.finishRender();
    },
    
    // This is important for layout notably
    onResize: function(w, h) {
        this.callParent(arguments);
        this.childComponent.setSize(w - this.getLabelWidth(), h);
    }
});