Ext.define('vcube.form.field.usbfilters', {

	extend: 'Ext.form.field.Base',
    alias: 'widget.usbfiltersfield',

    mixins: {
        field: 'Ext.form.field.Field'
    },

    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',

    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	var filters = [];
    	this.grid.getStore().each(function(record) {
    		var filter = record.getData();
    		delete filter.id;
    		filters.push(filter);
    	});

    	return filters;
    },
    
    setValue: function(val) {
    
    	var store = this.grid.getStore();
    	store.removeAll();
    	
    	if(!val) val = [];
    	store.add(Ext.Array.map(val, function(v){
    		return Ext.apply({id: 'usb-filter-' + Ext.id()}, v);
    	}));
    	
    },
    
    usbFilterDialog: {
    	
    	title: 'USB Filter Details',
    	icon: 'images/vbox/vm_settings_16px.png',
    	height: 300,
    	width: 400,
    	modal: true,
    	layout: 'fit',
    	items: [{
    		xtype: 'form',
    		layout: 'form',
    		listeners: {
    			validitychange: function(frm, valid) {
    				frm.owner.up('.window').down('#ok').setDisabled(!valid);
    			}
    		},
    		frame: true,
    		defaults: {
    			xtype: 'textfield',
    			labelAlign: 'right'
    		},
    		items: [{
    			fieldLabel: 'Name',
    			name: 'name',
    			allowBlank:false
    		},{
    			fieldLabel: 'Vendor ID',
    			name: 'vendorId'
    		},{
    			fieldLabel: 'Product ID',
    			name: 'productId'
    		},{
    			fieldLabel: 'Revision',
    			name: 'revision'
    		},{
    			fieldLabel: 'Manufacturer',
    			name: 'manufacturer'
    		},{
    			fieldLabel: 'Product',
    			name: 'product'
    		},{
    			fieldLabel: 'Serial No.',
    			name: 'serialNumber'
    		},{
    			fieldLabel: 'Port',
    			name: 'port'
    		},{
    			fieldLabel: 'Remote',
    			name: 'remote',
    			xtype: 'combo',
    			editable: false,
    			queryLocal: true,
    			displayField: 'name',
    			valueField: 'value',
    			store: Ext.create('Ext.data.Store',{
    				fields: ['name',{name:'value',type:'string'}],
    				data: [
    				   {name: 'Any', value: ''},
    				   {name: 'Yes', value: '1'},
    				   {name: 'No', value: '0'}
    				]
    			})
    		}]
    		
    	}],
		buttons: [{
			text: 'OK',
			itemId: 'ok'
		},{
			text: 'Cancel',
			listeners: {
				click: function(btn) {
					btn.up('.window').close();
				}
			}
		}]
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);
    	
    	this.grid = this.childComponent = Ext.create('Ext.grid.Panel',{
    		
			height: 100,
			title: 'USB Device Filters',
			hideHeaders: true,
			frame: true,
			disabled: true,
			columns: [{
				dataIndex: 'active',
				xtype: 'checkcolumn'
			},{
				dataIndex: 'description'
			}],
			viewConfig: {
				markDirty: false,
		    	listeners: {
		    		render :function(view) {
				    	view.tip = Ext.create('Ext.tip.ToolTip', {
				    		
					        // The overall target element.
					        target: view.el,
					        // Each grid row causes its own seperate show and hide.
					        delegate: view.itemSelector,
					        // Moving within the row should not hide the tip.
					        trackMouse: true,
					        // Render immediately so that tip.body can be referenced prior to the first show.
					        renderTo: Ext.getBody(),
					        listeners: {
					            // Change content dynamically depending on which element triggered the show.
					        	
					            beforeshow: function(tip) {
					            	
					            	var record = view.getRecord(Ext.get(tip.triggerEvent.target).findParentNode(view.itemSelector));
					            	var props = [{
					            		fieldLabel: 'Vendor ID',
					            		name: 'vendorId'
						    		},{
						    			fieldLabel: 'Product ID',
						    			name: 'productId'
						    		},{
						    			fieldLabel: 'Revision',
						    			name: 'revision'
						    		},{
						    			fieldLabel: 'Manufacturer',
						    			name: 'manufacturer'
						    		},{
						    			fieldLabel: 'Product',
						    			name: 'product'
						    		},{
						    			fieldLabel: 'Serial No.',
						    			name: 'serialNumber'
						    		},{
						    			fieldLabel: 'Port',
						    			name: 'port'
						    		}];

					            	var tipTextList = [];
					            	Ext.each(props, function(p) {
					            		if(record.get(p.name)) {
					            			tipTextList.push(p.fieldLabel + ': ' + record.get(p.name));
					            		}
					            	});
					            	
					            	if(tipTextList.length) {
					            		tip.update(tipTextList.join('<br />'));
					            	} else {
					            		return false;
					            	}
					            	
					            }
					        }
				    	});
		    		}
		    	}
			},

			listeners: {
				
				itemdblclick: function() {
					this.grid.down('#btnEdit').fireEvent('click');
				},
				
				selectionchange: function(sm, selected) {
					
					var index = selected.length ? this.grid.getStore().indexOf(selected[0]) : -1;
					
					this.grid.down('#btnMoveUp').setDisabled(index == 0 || !selected.length);
					this.grid.down('#btnMoveDown').setDisabled(!selected.length || index == (this.grid.getStore().getCount()-1));
					this.grid.down('#btnEdit').setDisabled(!selected.length);
					this.grid.down('#btnRemove').setDisabled(!selected.length);
					
				},
				scope: this
			},
			store: Ext.create('Ext.data.Store',{
				fields: [
				         {name: 'id', type: 'string'},
				         {name: 'vendorId', type: 'string'},
				         {name: 'product', type: 'string'},
				         {name: 'remote', type: 'string'},
				         {name: 'name', type: 'string'},
				         {name: 'serialNumber', type: 'string'},
				         {name: 'productId', type:'string'},
				         {name: 'active', type: 'boolean'},
				         {name: 'manufacturer', type: 'string'},
				         {name: 'port', type: 'string'},
				         {name: 'revision', type: 'string'}
			         ]
			}),
			rbar: [
			       {
			    	   icon: 'images/vbox/usb_new_16px.png',
			    	   tooltip: 'Adds a new USB device filter with all fields set to empty strings. Note that such a filter will match any attached USB device.',
			    	   listeners: {
			    		   click: function() {
			    			   
			    			   var nameTpl = 'New Filter ';
			    			   var number = this.grid.getStore().getCount() + 1;
			    			   var name = nameTpl + number;
			    			   
			    			   while(this.grid.getStore().findRecord('name',name)) {
			    				   name = nameTpl + (++number);
			    			   }
			    			   
			    			   this.grid.getStore().add({
			    				   'name': name,
			    				   active: true,
			    				   id: 'usb-filter-'+Ext.id()
			    			   });
			    			   this.grid.getView().focusRow(this.grid.getStore().getCount()-1);
			    		   },
			    		   scope: this
			    	   }
			    		  
			       },
			       {
			    	   icon: 'images/vbox/usb_add_16px.png',
			    	   tooltip: 'Adds a new USB device filter with the values of the selected USB device attached to the host PC.',
			    	   listeners: {
			    		   
			    		   click: function(btn) {
			    			   
			    			   btn.disable();
			    			   
			    			   var mnu = Ext.create('Ext.menu.Menu', {
						    	    renderTo: Ext.getBody(),
						    	    closeAction: 'destroy',
						    	    items: [{text:'Loading ...'}]
						    	});
			    			   
			    			    var coords = btn.getXY();
			    			    coords[1] = coords[1] + btn.getHeight();
			    				mnu.showAt(coords);
			    				
			    				var cleanHex = function(h) {
			    					return h.toUpperCase().replace(/^0X/,'');
			    				};
			    				
			    				var self=this;
			    				
			    				Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/hostGetUSBDevices',{connector:this.up('.window').serverId})).done(function(devs) {
			    					
			    					if(!mnu) return;
			    					mnu.removeAll(true);
			    					
			    					for(var i = 0; i < devs.length; i++) {
			    						
			    						var name = (devs[i].product ? (devs[i].product + ' ') : 'Unknown device ') + cleanHex(devs[i].vendorId) + (devs[i].vendorId ? ':' : '') + cleanHex(devs[i].productId) + 
			    							(devs[i].revision ? ' [' + cleanHex(devs[i].revision) + ']' : '');
			    						
			    						mnu.add({
			    							text: name,
			    							usbdata: devs[i],
			    							listeners: {
			    								click: function(item) {
			    									
			    									// Correct "remote" on some platforms
			    									if(item.usbdata.remote == false) item.usbdata.remote = '0';
			    									else if(item.usbdata.remote == true) item.usbdata.remote = '1';
			    									
			    									self.grid.getStore().add(Ext.apply({},{
			    										id: 'usb-filter-'+Ext.id(),
			    										name: item.text,
			    										active: true,
			    										vendorId: item.usbdata.vendorId.replace(/^0x/,''),
			    										productId: item.usbdata.productId.replace(/^0x/,''),
			    										revision: item.usbdata.revision.replace(/^0x/,''),
			    										port: (item.usbdata.port ? item.usbdata.port : undefined)
			    									},item.usbdata));
			    									
		    					    			   self.grid.getView().focusRow(self.grid.getStore().getCount()-1);

			    								},
			    								scope: self
			    							}
			    						});
			    					}
			    				}).always(function(){
			    					btn.enable();
			    				});

			    		   },
			    		   scope: this
			    	   }
			       },
			       {
			    	   icon: 'images/vbox/usb_filter_edit_16px.png',
			    	   tooltip: 'Edits the selected USB filter.',
			    	   itemId: 'btnEdit',
			    	   disabled: true,
			    	   listeners: {
			    		   click: function() {
			    			   var dlg = Ext.create('Ext.window.Window',this.usbFilterDialog);
			    			   dlg.down('.form').getForm().setValues(this.grid.getSelectionModel().getSelection()[0].getData());
			    			   dlg.down('#ok').on('click', function(btn) {
			    	    				
			    	    				this.grid.getSelectionModel().getSelection()[0].set(btn.up('.window').down('.form').getForm().getValues());
			    	    				btn.up('.window').close();
			    	    				
			    	    		},this);

			    			   dlg.show();
			    		   },
			    		   scope: this
			    	   }

			       },{
		    		   icon: 'images/vbox/usb_remove_16px.png',
		    		   disabled: true,
		    		   itemId: 'btnRemove',
		    		   tooltip: 'Removes the selected USB filter.',
			    	   listeners: {
			    		   click: function() {
    						   
			    			   var sm = this.grid.getSelectionModel();
			    			   var record = this.grid.getSelectionModel().getSelection()[0];
    						   var store = this.grid.getStore();
    						   var index = store.indexOf(record);

    						   var nextRecord = store.getAt(index+1);
    						   if(!nextRecord) nextRecord = store.getAt(index-1);
    						   
    						   store.remove(record);
    						   
    						   if(nextRecord) sm.select(nextRecord);
			    		   },
			    		   scope: this
			    	   }
			       },{
	    			   icon: 'images/vbox/usb_moveup_16px.png',
	    			   itemId: 'btnMoveUp',
	    			   tooltip: 'Moves the selected USB filter up.',
	    			   disabled: true,
			    	   listeners: {
			    		   click: function() {
			    			   
    						   var record = this.grid.getSelectionModel().getSelection()[0];
    						   var store = this.grid.getStore();
    						   var index = store.indexOf(record);
    						   
    						   store.remove(record);
    						   store.insert(index-1, record);
    						   this.grid.getSelectionModel().select(record, false, false);

			    		   },
			    		   scope: this
			    	   }
			       },{
    				   icon: 'images/vbox/usb_movedown_16px.png',
    				   itemId: 'btnMoveDown',
    				   tooltip: 'Moves the selected USB filter down.',
    				   disabled: true,
    				   listeners: {
    					   click: function() {
    						   
    						   var record = this.grid.getSelectionModel().getSelection()[0];
    						   var store = this.grid.getStore();
    						   var index = store.indexOf(record);
    						   
    						   store.remove(record);
    						   store.insert(index+1, record);
    						   this.grid.getSelectionModel().select(record, false, false);
    						   
    					   },
    					   scope: this
    				   }
			       }],
	       columns: [{
	    	   dataIndex: 'active',
	    	   xtype: 'checkcolumn',
	    	   submitValue: false,
	    	   width: 20
	       },{
	    	   dataIndex: 'name',
	    	   flex: 1,
	    	   renderer: function(v) {
	    		   return Ext.String.htmlEncode(v);
	    	   }
	       }]
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

    // --- Resizing ---
    // This is important for layout notably
    onResize: function(w, h) {
        this.callParent(arguments);
        this.childComponent.setSize(w - this.getLabelWidth(), h);
    }
	

});