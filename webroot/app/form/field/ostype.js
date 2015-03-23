Ext.define('vcube.form.field.ostype', {
    extend: 'Ext.form.FieldContainer',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.ostypefield',
    combineErrors: true,
    border: false,
    msgTarget: 'side',
    submitFormat: 'c',
    
    defaults: {},
    
    layout: 'hbox',
    margin: 0,
    padding: 0,
    
    ostypes: {},
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	return this.osTypeIdCombo.getValue();
    },
    
    setValue: function(val) {
    	this.osTypeIdCombo.setValue(val);
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	/* OS Type image */
    	this.osTypeImage = Ext.create('Ext.Img',{
			src: 'images/vbox/blank.gif',
			height: 32,
			width: 32,
			margin: 8

    	});
    	
    	/* OS Family - only used for organization */
    	this.osFamilyIdCombo = Ext.create('Ext.form.field.ComboBox',{
			editable: false,
			fieldLabel: 'Type',
			labelAlign: 'right',
			submitValue: false,
			displayField: 'familyDescription',
			valueField: 'familyId',
			queryMode : 'local',
			store: Ext.create('Ext.data.Store',{
				fields: ['familyId', 'familyDescription']
			}),
			listeners: {
				change: function(cbo, value) {
					
					var store = this.osTypeIdCombo.getStore();
					
					var initialValue = this.osTypeIdCombo.getValue();
					
					store.removeAll();
					var osTypes = [];
					
					Ext.iterate(this.ostypes, function(k,v) {
						if(v.familyId == value) {
							osTypes.push({
								id: v.id,
								description: v.description
							});
						}
					});
					
					store.loadRawData(osTypes);
					this.osTypeIdCombo.select(store.getById(initialValue) || store.first());
					
				},
				scope: this
			}
    	});
    	
    	/* OS Type ID */
    	this.osTypeIdCombo = Ext.create('Ext.form.field.ComboBox',{
			editable: false,
			fieldLabel: 'Version',
			itemId: 'OSTypeVersion',
			labelAlign: 'right',
			submitValue: false,
			displayField: 'description',
			valueField: 'id',
			queryMode : 'local',
			store: Ext.create('Ext.data.Store',{
				fields: ['id', 'description']
			}),
			listeners: {
				change: function(cbo, value, old) {
					
					this.osTypeImage.setSrc('images/vbox/'+vcube.utils.vboxGuestOSTypeIcon(value));
					
					// Set family combo if this is an initial selection
					try {
						this.osFamilyIdCombo.select(this.ostypes[value].familyId);						
					} catch (err) {
						
					}

				},
				scope: this
			}
    	});
    	
    	this.items = [{
    			layout: 'form',
    			bodyStyle: { background: 'transparent' },
    			border: false,
    			padding: 0,
    			margin: 0,
    			flex: 1,
    			defaults: {
    				labelAlign: 'right'
    			},
    			items: [this.osFamilyIdCombo, this.osTypeIdCombo]
    		},
    		this.osTypeImage
    		];
    	
	    
    	this.ostypes = {};

    	this.callParent(arguments);
	    
	    this.on({
	    	render: function() {
	    		
	    		var self = this;
	    		
	        	Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/vboxGetGuestOSTypes',{connector:this.up('.window').serverId})).done(function(data) {
	        		
	        		var famIdsSeen = {};
	        		var families = [];
	        		
	        		Ext.each(data, function(ostype) {
	        			
	        			// Skip if not supported
	        			if(ostype.supported) {
	        				
	        				if(!famIdsSeen[ostype.familyId]) {
	        					famIdsSeen[ostype.familyId] = true;
	        					families.push({
	        						familyId: ostype.familyId,
	        						familyDescription: ostype.familyDescription
	        					});
	        					
	        				}
	        				
	        				self.ostypes[ostype.id] = {
	        						'id': ostype.id,
	        						'description' : ostype.description,
	        						'familyId': ostype.familyId
	        				}    				
	        			}
	        			
	        		});
	        		
	        		// Populte family id store
	        		self.osFamilyIdCombo.store.loadRawData(families);
	        		
	        		// Set initial value
	        		var initVal = self.osTypeIdCombo.getValue() || 'WindowsXP';
	        		
	        		// Find family id of value
	        		self.osFamilyIdCombo.select(self.ostypes[initVal].familyId);
	        		self.osTypeIdCombo.select(initVal);
	        		
	        		
	        	});
	        	
	    		
	    	},
	    	scope: this
	    });

    }

});