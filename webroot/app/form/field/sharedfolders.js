Ext.define('vcube.form.field.sharedfolders', {

	extend: 'Ext.form.field.Base',
    alias: 'widget.sharedfoldersfield',
    
    requires: ['vcube.widget.fsbrowser'],
    
    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    statics: {    	
    	sfOtherPathName: 'Other ...',    	
    },

    layout: 'fit',

    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
    
    padding: 0,
    margin: 0,
    
    /* Get / Set values */
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	var filters = [];
    	this.grid.getStore().each(function(record) {
    		filters.push(record.getData());
    	});

    	return filters;
    },
    
    setValue: function(val) {
    
    	var store = this.grid.getStore();
    	store.removeAll();
    	
    	if(!val) val = [];
    	store.loadData(val);
    	
    },
    
    
    /* Recent shared folder list + "Other ..." */
    addSharedFoldersCboItem: function(path) {
    	
    	if(!path) return;
    	
    	// Add to recent list
    	vcube.app.localConfig.addToList('recentSharedFolders-' + this.up('.window').serverId, path, 5);
    	
    },
    
    getSharedFoldersCboItems: function() {
    	
    	var list = [];
    	try {
    		list = vcube.app.localConfig.get('recentSharedFolders-' + this.up('.window').serverId) || [];    		
    	} catch (err) {
    		// Remove config, something is corrupt
    		vcube.app.localConfig.remove('recentSharedFolders-' + this.up('.window').serverId);
    		list = [];
    	}
    	list.push(vcube.form.field.sharedfolders.sfOtherPathName);
    	
    	return Ext.Array.map(list,function(p){
    		return {path:p};
    	});
    	
    },
    
    
    /** Init items **/
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);

    	/* Defined here so we can have scope: this */
        this.sharedFolderDialog = {
        	
        	title: 'Add Share',
        	icon: 'images/vbox/vm_settings_16px.png',
        	height: 200,
        	width: 500,
        	modal: true,
        	editing: false, // true if editing an existing share
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
    				fieldLabel: 'Folder Path',
        			xtype: 'combo',
    				name: 'hostPath',
    				allowBlank:false,
    				editable: true,
    				store: Ext.create('Ext.data.ArrayStore',{
    					autoLoad: false,
    					remoteFilter: false,
    					remoteSort: false,
    					fields: ['path'],
    					listeners: {
    						load: function(store) {
    							store.add(this.getSharedFoldersCboItems());
    						},
    						scope: this
    					}
    				}),
    				displayField: 'path',
    				valueField: 'path',
    				listConfig: {
    			        getInnerTpl: function() {
    			            // here you place the images in your combo
    			            return '<div><tpl if="path==\'' + vcube.form.field.sharedfolders.sfOtherPathName +'\'">'+
    			                      '<img src="images/vbox/select_file_16px.png" align="left">&nbsp;&nbsp;'+
    			                      '</tpl>{path}</div>';
    			        }
    			    },
    				listeners: {
    					
    					change: function(cbo, val, oldVal) {
    						
    						// "Other ... browse for folder 
    						if(val == vcube.form.field.sharedfolders.sfOtherPathName) {
    							
    							var browser = Ext.create('vcube.widget.fsbrowser',{
    				    			browserType: 'folder',
    				    			serverId: this.up('.window').serverId,
    				    			title: 'Select folder...',
    				    			initialPath: (oldVal ? oldVal : null),
    				    			pathType: 'sharedFolder'
    				    		});
    				    		
    				    		Ext.ux.Deferred.when(browser.browse()).done(function(f) {
    				    			cbo.setValue(f);
    				    		});

    							cbo.setValue((oldVal ? oldVal : ''));
    							return;
    						}
    						
    						if(cbo.up('.window').editing) return;
    						
    						var text = vcube.utils.basename(val.replace(/[\\|\/]$/,''));
    						
    						// Windows drive letter
    						if(/^[a-z]:[\\|\/]?$/i.test(val)) {
    							text = String(val[0] + '_DRIVE').toUpperCase();
    							// root folder
    						} else if(val == '/') {
    							text = 'root';
    						} else if(!text) {
    							text = val.replace(/\\|\//g, '');
    						}
    						cbo.up('.form').down('[name=name]').setValue(text);
    					},
    					scope: this
    				}
    			},{
        			fieldLabel: 'Folder Name',
        			name: 'name',
        			allowBlank:false,
        			maskRe: /[^\s]/,
        			validator: function(val) {
        				return /[^\s]/.test(val);
        			},
        			listeners: {
        				change: function(t, val) {
        					val = val.replace(/\s+/g, '');
        					t.setValue(val);
        				}
        			}
        		},{
        			xtype: 'checkbox',
        			inputValue: true,
        			fieldLabel: ' ',
        			labelSeparator: '',
        			boxLabel: 'Read-only',
        			name: 'writable',
        			itemId: 'writable'
        		},{
        			xtype: 'checkbox',
        			inputValue: true,
        			fieldLabel: ' ',
        			labelSeparator: '',
        			boxLabel: 'Auto-mount',
        			name: 'autoMount',
        			inputValue: 1
        		},{
        			xtype: 'checkbox',
        			inputValue: true,
        			fieldLabel: ' ',
        			labelSeparator: '',
        			boxLabel: 'Make Permanent',
        			inputValue: 'machine',
        			itemId: 'makePermanent',
        			name: 'type'
        		}]
        		
        	}],
        	
    		buttons: [{
    			text: 'OK',
    			itemId: 'ok',
    			disabled: true
    		},{
    			text: 'Cancel',
    			listeners: {
    				click: function(btn) {
    					btn.up('.window').close();
    				}
    			}
    		}]

    		

        };
        
    	this.grid = this.childComponent = Ext.create('Ext.grid.Panel',{
    		
    		title: 'Shared Folders',
			xtype: 'gridpanel',
			height: 300,
			frame: true,
			features: [{
				ftype:'grouping',
				enableGroupingMenu: false,
				groupHeaderTpl: '<tpl if="name==\'machine\'">Machine Folders</tpl><tpl if="name==\'transient\'">Transient Folders</tpl>'
			}],
			columns: [{
				header: 'Name',
				dataIndex: 'name',
				renderer: function(v,m,record) {
					return '<div style="margin-left: 24px;">'+Ext.String.htmlEncode(v)+'</div>';
				}
			},{
				header: 'Path',
				dataIndex: 'hostPath',
				flex: 1,
				renderer: function(v,m,record) {
					var xtra = '';
					if(!record.get('accessible') && record.get('lastAccessError')) {
						xtra = '<img style="height: 12px; width:12px; display: inline-block; margin: 0px; padding: 0px; float:left; margin-right: 4px;" src="images/vbox/status_error_16px.png" />';
					}
					return xtra + Ext.String.htmlEncode(v);
				}
			},{
				header: 'Auto-mount',
				dataIndex: 'autoMount',
				width: 80,
				renderer: function(v) {
					return (v ? 'Yes' : 'No');
				}
			},{
				header: 'Access',
				dataIndex: 'writable',
				width: 80,
				renderer: function(v) {
					return (v ? 'Full' : 'Read-only');
				}
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
					            	if(!record.get('accessible') && record.get('lastAccessError')) {
					            		tip.update(Ext.String.htmlEncode(record.get('lastAccessError')));
					            	} else {
					            		tip.update(Ext.String.htmlEncode(record.get('name')));
					            	}
					            }
					        }
				    	});
		    		}
		    	}
			},

			listeners: {
				
				itemdblclick: function() {
					this.grid.down('#edit').fireEvent('click');
				},

				selectionchange: function(sm, selected) {
					this.grid.down('#edit').setDisabled(!selected.length);
					this.grid.down('#remove').setDisabled(!selected.length);
				},
				scope: this
			},
			store: Ext.create('Ext.data.Store',{
				fields: [
			         {name: 'accessible', type: 'boolean'},
			         'name',
			         {name:'autoMount', type: 'boolean'},
			         {name:'writable', type: 'boolean'},
			         {name:'lastAccessError', type: 'string'},
			         'hostPath',
			         'type'
		         ],
		         groupers: [{
		        	 property: 'type',
				     sorterFn: function(a, b) {
				    	 return vcube.utils.strnatcasecmp(a.data.name, b.data.name);
				    }
		         }],
		         listeners: {
		        	 
	        	 	add: function(store, records) {

	        	 		for(var i = 0; i < records.length; i++) {
	        	 			
	        	 			this.addSharedFoldersCboItem(records[i].get('hostPath'));
	        	 		}
	        	 		
	        	 	},
	        	 	
	        	 	update: function(store, record, op, fields) {
	        	 		
	        	 		if(op != Ext.data.Model.EDIT) return;
	        	 		
	        	 		this.addSharedFoldersCboItem(record.get('hostPath'));
	        	 		
	        	 	},
	        	 	
	        	 	scope: this
		         }
			}),
			dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'right',
			    items: [
			        {
			        	icon: 'images/vbox/sf_add_16px.png',
			        	listeners: {
			        		click: function(btn) {
			        			
			        			var dlg = Ext.create('Ext.window.Window',Ext.apply({title:'Add Share'}, this.sharedFolderDialog));
			        			
			        			if(!vcube.utils.vboxVMStates.isRunning(vcube.storemanager.getStoreRecord('vm',this.up('.window')._data.id)))
			        				dlg.down('#makePermanent').hide();
			        			
			        			// Set name validator
			        			var invalidList = [];
			        			this.grid.getStore().each(function(r){
			        				invalidList.push(r.get('name'));
			        			});
			        			dlg.down('[name=name]').validator = function(val) {
			        				return Ext.Array.contains(invalidList, val) ? 'The shared folder name already exists.' : true;
			        			}

			        			dlg.down('#ok').on('click',function(btn) {
			        				
			        				var data = dlg.down('.form').getForm().getValues();

			        				// writable is labeled "Read-only"
			        				data.writable = (data.writable ? false : true);
			        				data.autoMount = (data.autoMount ? true : false);
			        				data.accessible = true;
			        				data.type = (dlg.down('#makePermanent').isVisible() && !dlg.down('#makePermanent').getValue() ? 'transient' : 'machine');
			        				
			        				this.grid.getStore().add(data);
			        				btn.up('.window').close();
			        				
			        			},this);
			        			
			        			dlg.show();
			        		},
			        		scope: this
			        	}
			        },{
			        	icon: 'images/vbox/sf_edit_16px.png',
			        	disabled: true,
			        	itemId: 'edit',
			        	listeners: {
			        		click: function() {
			        			
			        			var dlg = Ext.create('Ext.window.Window',this.sharedFolderDialog);
			        			dlg.editing = true;
			        			dlg.title = 'Edit Share';
			        			
			        			if(!vcube.utils.vboxVMStates.isRunning(vcube.storemanager.getStoreRecord('vm',this.up('.window')._data.id)))
			        				dlg.down('#makePermanent').hide();
			        			
			        			var data = this.grid.getSelectionModel().getSelection()[0].getData();
			        			// writable is labeled "Read-only"
			        			data.writable = !(data.writable);

			        			// Set name validator
			        			var invalidList = [];
			        			this.grid.getStore().each(function(r){
			        				if(r.get('name') != data.name)
			        					invalidList.push(r.get('name'));
			        			});
			        			dlg.down('[name=name]').validator = function(val) {
			        				return Ext.Array.contains(invalidList, val) ? 'The shared folder name already exists.' : true;
			        			}

			        			
			        			dlg.down('.form').getForm().setValues(data);
			        						        			
			        			dlg.down('#ok').on('click',function(btn) {
			        				
			        				var data = dlg.down('.form').getForm().getValues();
			        				
			        				// writable is labeled "Read-only"
			        				data.writable = (data.writable ? false : true);
			        				data.autoMount = (data.autoMount ? true : false);
			        				
			        				// If path has changed, clear access error
			        				if(data.hostPath != this.grid.getSelectionModel().getSelection()[0].get('hostPath'))
			        					data.accessible = true;
			        				
			        				data.type = (dlg.down('#makePermanent').isVisible() && !dlg.down('#makePermanent').getValue() ? 'transient' : 'machine');
			        				
			        				this.grid.getSelectionModel().getSelection()[0].set(data);
			        				btn.up('.window').close();
			        				
			        			},this);
			        			
			        			dlg.show();
			        		},
			        		scope: this
			        	}

			        },{
			        	icon: 'images/vbox/sf_remove_16px.png',
			        	disabled: true,
			        	itemId: 'remove',
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

			        }
			    ]
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