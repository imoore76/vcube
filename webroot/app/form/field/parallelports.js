Ext.define('vcube.form.field.parallelports', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.parallelportsfield',
    combineErrors: true,
    border: false,
    padding: 0,
    margin: 0,
    msgTarget: 'side',
    submitFormat: 'c',
    
    maxPorts: 2,
    
    portModeStore: Ext.create('vcube.data.VboxEnumStore',{
    	enumClass: 'PortMode',
    	ignoreNull: true,
    	conversionFn: vcube.utils.vboxSerialMode
    }),
    
    portNumberStore: Ext.create('Ext.data.Store',{

    	fields: ['name',{name: 'irq', type: 'int'}, 'port'],
    	
    	autoload: false,
    	remoteSort: false,
    	remoteFilter: false,
    	
    	data: vcube.utils.vboxParallelPorts.ports.concat(
    			[{name: 'User-defined', irq: 0, port: '0x000'}])
    	
    }),
    
	defaults: {
		frame: true,
		padding: 6,
		layout: 'form',
		fieldDefaults: {
			labelAlign: 'right'
		}
	},
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	
    	var self = this;
    	
    	// Shorthand
    	var origData = this.up('.window')._data[this.name];

    	for(var i = 0; i < origData.length; i++) {
    		var tab = self.childComponent.items.items[i];
    		Ext.iterate(origData[i], function(k,v) {
    			var f = tab.down('[name=parallelPort-'+k+'-'+i+']');
    			if(f)
    				origData[i][k] = Ext.isObject(origData[i][k]) ? Ext.Object.merge(origData[i][k], f.getValue()) : f.getValue();
    		})
    	}
    	return origData;
    },
    
    setValue: function(val) {
    	
    	if(!val) val = [];
    	for(var i = 0; i < Math.min(val.length,this.maxPorts); i++) {
    		
    		var tab = this.childComponent.items.items[i];
    		Ext.iterate(val[i], function(k, v) {
    			var f = tab.down('[name=parallelPort-'+k+'-'+i+']');
    			if(f && f.setValue) f.setValue(v);
    		});
    		
    		var irq = tab.down('#irq').getValue();
    		var port = tab.down('#ioport').getValue();
    		
    		tab.down('#portname').setValue(vcube.utils.vboxParallelPorts.getPortName(irq,port));
    	}
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.childComponent = Ext.create('Ext.tab.Panel',{
    		title: 'parallel Ports',
    		frame: true,
    		padding: 6,
    		layout: 'form',
    		defaults: {
    			frame: true,
    			padding: 6,
    			layout: 'form',
    			fieldDefaults: {
    				labelAlign: 'right'
    			}
    		},
    	    border: false
    	});
    	
    	for(var i = 0; i < this.maxPorts; i++) {
    		
    		this.childComponent.add({
    			title: 'Port ' + (i+1),
    			frame: true,
    			layout: 'form',
    			defaults: {
    				labelAlign: 'right',
    				submitValue: false
    			},
    			items: [{
    				xtype: 'checkbox',
    				boxLabel: 'Enable parallel Port',
    				name: 'parallelPort-enabled-'+i
    			},{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				defaults: {
    					labelAlign: 'right',
    					defaults: {
    						submitValue: false
    					}
    				},
    				items: [{
    					xtype: 'combo',
    					editable: false,
    					fieldLabel: 'Port Number',
        				displayField: 'name',
        				valueField: 'name',
        				itemId: 'portname',
        				store: this.portNumberStore,
        				lastQuery: '',
        				listeners: {
        					
        					change: function(cbo,val) {
        						
        						if(val=='User-defined') {
        							cbo.ownerCt.down('#irq').setDisabled(false);
        							cbo.ownerCt.down('#ioport').setDisabled(false);
        							return;
        						}
        						
        						var r = this.portNumberStore.findRecord('name',val);
        						
    							cbo.ownerCt.down('#irq').setValue(r.get('irq'));
    							cbo.ownerCt.down('#ioport').setValue(r.get('port'));
    							cbo.ownerCt.down('#irq').setDisabled(true);
    							cbo.ownerCt.down('#ioport').setDisabled(true);
        						
        					},
        					scope: this
        				}
    				},{
    					xtype: 'numberfield',
    					labelWidth: 50,
    					inputWidth: 50,
    					fieldLabel: 'IRQ',
    					itemId: 'irq',
    					name: 'parallelPort-IRQ-'+i
    				},{
    					xtype: 'textfield',
    					labelWidth: 80,
    					inputWidth: 50,
    					fieldLabel: 'I/O Port',
    					itemId: 'ioport',
    					name: 'parallelPort-IOBase-'+i
    				}]
    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Port Mode',
    				displayField: 'display',
    				valueField: 'value',
    				store: this.portModeStore,
    				lastQuery: '',
    				name: 'parallelPort-hostMode-'+i
    			},{
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				boxLabel: 'Create Pipe',
    				name: 'parallelPort-server-'+i
    			},{
    				xtype: 'textfield',
    				fieldLabel: 'Port/File Path',
    				name: 'parallelPort-path-'+i
    			}]
    		});
    	}
    	
	    this.callParent(arguments);

	    this.on({
	    	
	    	destroy : function() { Ext.destroy(this.childComponent);},

	    	render: function() {
	    		this.portModeStore.setServer(this.up('.window').serverId);
	    	},
	    	
	    	scope: this

	    });
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