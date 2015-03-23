Ext.define('vcube.form.field.storage', {

	extend: 'Ext.form.field.Base',
    alias: 'widget.storagefield',

    mixins: {
        field: 'Ext.form.field.Field'
    },
    
    layout: 'fit',
    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
    
    margin: 0,
    
    cachedMedia: {},
    
    attachedMedia: {},
    
    statics: {
    	
    	recentMediaLimit: 5,
    	
    	browseMedia: function(mediaType, serverId, initialPathO) {
    		
    		var promise = Ext.create('Ext.ux.Deferred');
    		
    		var browser = Ext.create('vcube.widget.fsbrowser',{
    			browserType: mediaType,
    			serverId: serverId,
    			initialPath: initialPathO
    		});
    		
    		var vboxMediaType = 'HardDisk';
    		if(mediaType == 'fd') {
    			vboxMediaType = 'Floppy';
    		} else if (mediaType == 'cd') {
    			vboxMediaType = 'DVD';
    		}
    		
    		Ext.ux.Deferred.when(browser.browse()).done(function(file) {
    			vcube.app.setLoading(true);
    			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/mediumAdd',{
    				path:file,
    				connector: serverId,
    				type:vboxMediaType
    			})).done(function(data) {
    				
    				vcube.app.localConfig.addToList('recentMedia-'+mediaType+'-' + serverId, data.location, vcube.form.field.storage.recentMediaLimit);
    				
    				promise.resolve(data);
    			}).always(function(){
    				vcube.app.setLoading(false);
    			});
    		});

    		return promise;
    	}
        

    },
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {

    	/* Only these properties are submitted */
    	var controllerProperties = ['name','controllerType','bus','portCount','useHostIOCache'];
    	var attachmentProperties = ['device','port','medium','nonRotational','temporaryEject','type','passthrough'];
    	var mediumProperties = ['id','hostDrive','name','location']
    	var controllers = [];
    	
    	this.tree.getRootNode().eachChild(function(c) {
    		
    		var attachments = [];
    		
    		c.eachChild(function(ma) {
    			var adata = ma.getData();
    			var attachment = {};
    			Ext.each(attachmentProperties, function(k){
    				attachment[k] = adata[k];
    				if(k == 'medium' && adata[k]) {
    					attachment[k] = {}
    					Ext.each(mediumProperties, function(mk) {
    						attachment[k][mk] = adata[k][mk];    						
    					})
    				}
    			})
    			attachments.push(attachment);
    		});
    		
    		var cdata = c.getData();
    		var controller = {mediumAttachments: attachments};
    		Ext.each(controllerProperties, function(k) {
    			controller[k] = cdata[k];
    		});
    		
    		controllers.push(controller);
    	});

    	return controllers;
    },
    
    addController: function(c) {
    	
    	
    	var child = this.tree.getRootNode().createNode(Ext.Object.merge({
    		text: c.name,
    		icon: 'images/vbox/' + vcube.utils.vboxStorage.getBusIconName(c.bus) + '_collapse_16px.png',
    		leaf: false,
    		iconCls: 'storageTreeExpander',
    		expanded: true
    	}, c));
    	
    	this.tree.getRootNode().appendChild(child);
    	
    	var self = this;
    	
    	Ext.each(c.mediumAttachments, function(ma) {
    		self.addMediumAttachment(child, ma);
    	});
    	
    	// Remove from being available to add
    	this.actions['add' + c.bus + 'Controller'].disable();
    	
    	// Disable add controller if we've hit the max
		if(this.tree.getRootNode().childNodes.length == vcube.utils.vboxStorage.getBusTypes().length) {
			this.actions['addController'].disable();
		}

		return child;
    },
    
    addMediumAttachment: function(c, ma, select) {
    	
		var maNode = c.createNode(Ext.Object.merge({
			text: ma.medium,
			icon: 'images/vbox/' + vcube.utils.vboxStorage.getMAIconName(ma) + '_16px.png',
			cls: 'mediumAttachment',
			leaf: true
		}, ma));
		
		c.appendChild(maNode);
		
		if(select) this.tree.getSelectionModel.select(maNode);
		
		// Get info about this attachment
		if(ma.medium && ma.medium.id) {
			
			if(!this.cachedMedia[ma.medium.id]) {
				// In-progress
				this.cachedMedia[ma.medium.id] = {};
				var self = this;
				Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/mediumGetBaseInfo',{name:ma.medium.name, hostDrive:ma.medium.hostDrive,medium:ma.medium.id,'type':ma.medium.deviceType,connector:this.up('.window').serverId})).done(function(data){
					Ext.apply(self.cachedMedia[ma.medium.id], data);
					maNode.set('medium',data);
				});
			} else {
				maNode.set('medium', this.cachedMedia[ma.medium.id]);
			}
		}
				
    	
		return maNode;
    },
    
    setValue: function(controllers) {
    
    	// Reset these
        this.cachedMedia = {};      
        this.attachedMedia = {};

    	var self = this;
    	this.tree.getRootNode().removeAll(true);
    	
    	if(!controllers) controllers = [];
    	
    	this.actions['addController'].enable();

    	// Enable all controllers
    	Ext.each(vcube.utils.vboxStorage.getBusTypes(), function(bus) {
    		self.actions['add'+bus+'Controller'].enable();
    	});
    	Ext.each(controllers, function(c) {
    		
    		self.addController(c);
    		
        	Ext.each(c.mediumAttachments, function(ma) {
        		if(ma.medium && ma.medium.id)
        			self.attachedMedia[ma.medium.id] = true;
        	});

    		
    	});


    	// There were controllers
    	if(controllers.length) {
    		
    		// select first item in tree
    		this.tree.getSelectionModel().selectRange(0,0);
    		    		
    	}
    	
    },
    
    /**
     * Elect next node to be selected if this one is removed
     */
    electNextNode: function(node) {
    	var selectAfter = node.nextSibling;
		if(!selectAfter) selectAfter = node.previousSibling;
		if(!selectAfter) selectAfter = (node.parentNode.isRoot() ? null : node.parentNode);
		return selectAfter;
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this,options);
    	
    	/**
    	 * Compose actions
    	 */
    	var self = this;

    	// Global actions
    	this.actions = {
    			
    		removeController: new Ext.Action({
    			icon: 'images/vbox/controller_remove_16px.png',
    			text: 'Remove Controller',
    			handler: function() {
    				
    				var selected = this.tree.getSelectionModel().getSelection()[0];
    				
    				// Re-enable adding of this controller type and the global
    				// add controller button
    				this.actions['add' + selected.raw.bus + 'Controller'].enable();
    				this.actions['addController'].enable();
    				
    				selected.removeAll(true);

    				this.tree.getSelectionModel().deselectAll();
    				
    				var selectAfter = this.electNextNode(selected);
    				selected.parentNode.removeChild(selected, true);
    				
    				if(selectAfter) 
    					this.tree.getSelectionModel().select(selectAfter);
    				
    			},
	    		scope: this
    		}),
    		
    		removeAttachment: new Ext.Action({
    			icon: 'images/vbox/attachment_remove_16px.png',
    			text: 'Remove Attachment',
    			handler: function() {
    				
    				var selected = this.tree.getSelectionModel().getSelection()[0];

    				this.tree.getSelectionModel().deselectAll();
    				
    				var selectAfter = this.electNextNode(selected);
    				selected.parentNode.removeChild(selected, true);
    				
    				if(selectAfter) 
    					this.tree.getSelectionModel().select(selectAfter);

    			},
    			scope: this
    		})

    	};
    	    	
    	
    	// add controller actions and compose attachment types
    	var attachmentTypes = {};
    	var attachmentTypeActions = [];
    	var controllerTypeActions = [];
    	Ext.each(vcube.utils.vboxStorage.getBusTypes(), function(bus) {
    		self.actions['add'+bus+'Controller'] = new Ext.Action({
    			text: 'Add ' + bus + ' Controller',
    			busType: bus,
    			icon: 'images/vbox/' + vcube.utils.vboxStorage.getBusIconName(bus) + '_add_16px.png',
    			handler: function(btn) {
    				
    				var controller = {
        					name: btn.busType,
        					bus: btn.busType,
        					mediumAttachments: []
        				};
    				
    				var busInfo = vcube.utils.vboxStorage[btn.busType];
    				if(busInfo.configurablePortCount) {
    					controller.portCount = busInfo.maxPortCount
    				}
    				controller.controllerType = busInfo.types[0];
    				controller.useHostIOCache = !!(busInfo['useHostIOCacheDefault']);
    				
    				var node = this.addController(controller);
    				this.tree.getSelectionModel().select(node);
				},
				scope: self
    			
    		});
    		
    		controllerTypeActions.push(self.actions['add'+bus+'Controller']);
    		
    		Ext.each(vcube.utils.vboxStorage[bus].driveTypes, function(d) {
    			
    			if(attachmentTypes[d]) return;
    			attachmentTypes[d] = true;
    			
    			self.actions['add'+d+'Attachment'] = new Ext.Action({
        			text: 'Add ' + vcube.utils.vboxStorage.getMATypeText(d) + (d != 'HardDisk' ? ' Device'  : ''),
        			attachmentType: d,
        			icon: 'images/vbox/' + vcube.utils.vboxStorage.getMAIconName({type:d}) + '_add_16px.png',
        			handler: function(btn) {
        				
        				// Hold ref
        				var self = this;
        				
        				// Selected controller
        				var controller = self.tree.getSelectionModel().getSelection()[0];
        				
        				// dialog buttons
        				var buttons = [];
        				
        				// dialog question
        				var q = '';
        				
        				// Slot in which to add media
        				var slot = (function() {
        					
        					var slot = null;
        					
        					var selection = self.tree.getSelectionModel().getSelection()[0];
        					
        	    			// Get used slots
        	    			var usedSlots = {};
        	    			selection.eachChild(function(n) {
        	    				if(n.internalId != selection.internalId) {
        	    					usedSlots[n.get('port') + '-' + n.get('device')] = true;
        	    				}
        	    			});
        	    			
        	    			Ext.iterate(vcube.utils.vboxStorage[selection.raw.bus].slots(), function(k,v) {
        	    				if(!usedSlots[k]) {
        	    					slot = k;
        	    					return false;
        	    				}
        	    			});

        	    			return slot.split('-');

        				})();
        				
        				// Helper to add empty medium attachment
        				var addEmpty = function(matype) {
        					
        					self.tree.getSelectionModel().select(self.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
								type: matype,
								port: slot[0],
								device: slot[1],
								medium: null
							}));
        				};
        				
        				// Helper for choose disk
        				var chooseDisk = function(btn, browsetype, matype) {
							
        					var serverId = self.up('.window').serverId;
        					
							Ext.ux.Deferred.when(vcube.form.field.storage.browseMedia(browsetype, serverId)).done(function(m) {

								self.cachedMedia[m.id] = m;
								
								self.tree.getSelectionModel().select(self.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
    								type: matype,
    								port: slot[0],
    								device: slot[1],
    								medium: m
    							}));
								btn.up('.window').close();
							});

        				};
        				
        				// Helper function to generate choose disk button or splitbutton
        				var genChooseDiskButton = function(btext, mtype, matype) {

        					var rmenu = undefined;
        					
        					var serverId = self.up('.window').serverId;

        					var recents = vcube.app.localConfig.get('recentMedia-'+mtype+'-' + serverId) || [];

        					if(recents.length) {
        						
        						
        						rmenu = {
        								
        							items: [],
        							listeners: {
        								
        								click: function(mnu, item) {
        									
        									if(!item) return;
        									
        									vcube.app.setLoading(true);
        									
        									Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/mediumAdd',{
        										
        										path:item.initialConfig._medium_path,
        										connector: serverId,
        										type: matype
        										
        									})).done(function(data) {
        										
        										vcube.app.localConfig.addToList('recentMedia-'+mtype+'-' + serverId, data.location, vcube.form.field.storage.recentMediaLimit);
        										
        										self.cachedMedia[data.id] = data;
        										
        										self.tree.getSelectionModel().select(self.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
        		    								type: matype,
        		    								port: slot[0],
        		    								device: slot[1],
        		    								medium: data
        		    							}));
        										        										
        										
        									}).always(function(){
        										vcube.app.setLoading(false);
        									});
        									mnu.up('.window').close();
        								},
        								scope: self
        							}
        						}
        						Ext.each(recents, function(r) {
        							rmenu.items.push({
        								text: vcube.utils.basename(r),
        								_medium_path: r
        							});
        						});
        					}

        					return {
        						text: btext,
        						xtype: (recents.length ? 'splitbutton' : 'button'),
        						menu: rmenu,
        						handler: function(btn) {
        							chooseDisk(btn, mtype, matype);
        						},
        						scope: self
        					}
        				}
        				
        				switch(btn.attachmentType) {
        				
	        				case 'HardDisk':
	        					
	        					var rmenu = undefined;
	        					var recents = vcube.app.localConfig.get('recentMedia-hd-' + this.up('.window').serverId) || [];
	        					
	        					
	        					
	        					q = String('You are about a virtual hard disk to controller <b>%1</b>.<p>Would you '+
		        						'like to create a new, empty file to hold the disk contents or select '+
		        						'an existing one?</p>').replace('%1', Ext.String.htmlEncode(controller.get('name')));
	        					
	        					buttons = [genChooseDiskButton('Choose existing disk','hd','HardDisk'),
	        					   {
	        						text: 'Create new disk',
	        						handler: function(btn) {
	        							var self = this;
	        							Ext.ux.Deferred.when(vcube.form.field.storage.browseMedia('cd', this.up('.window').serverId)).done(function(m) {
	        								self.cachedMedia[m.id] = m;
	        								self.tree.getSelectionModel().select(self.addMediumAttachment(self.tree.getSelectionModel().getSelection()[0], {
		        								type: 'HardDisk',
		        								port: slot[0],
		        								device: slot[1],
		        								medium: m
		        							}));
	        								btn.up('.window').close();
	        							});
	        						},
	        						scope: self
	        					}];
	        					
	        					break;
	        					
	        				case 'DVD':
	        					
	        					q = String('You are about to add a new CD/DVD drive to the controller <b>%1</b>.<p>Would you'+
		        						'like to choose a virtual CD/DVD disk to put in the drive or to leave '+
		        						'it empty for now?</p>').replace('%1', Ext.String.htmlEncode(controller.get('name')));
		        					
	        					buttons = [genChooseDiskButton('Choose disk','cd','DVD'),{
	        						text: 'Leave empty',
	        						handler: function(btn) {
	        							addEmpty('DVD');
	        							btn.up('.window').close();
	        						},
	        						scope: self
	        					}];
	        					break;
	        					
	        				case 'Floppy':

	        					q = String('You are about to add a new floppy drive to the controller <b>%1</b>.<p>Would you'+
	        						'like to choose a virtual floppy disk to put in the drive or to leave '+
	        						'it empty for now?</p>').replace('%1', Ext.String.htmlEncode(controller.get('name')));
	        					
	        					buttons = [genChooseDiskButton('Choose disk','fd','Floppy'),,{
	        						text: 'Leave empty',
	        						handler: function(btn) {
	        							addEmpty('Floppy');
	        							btn.up('.window').close();
	        						},
	        						scope: self
	        					}];
	        					break;
	        					
        				}
        				vcube.utils.confirm(q,buttons);
    				},
    				scope: self
        			
        		});
    			
    			attachmentTypeActions.push(self.actions['add'+d+'Attachment']);
    			
    		});
    	});
    	
    	// Menus
    	var controllerTypeActionsMenu = Ext.create('Ext.menu.Menu',{
    		items: controllerTypeActions
    	});
    	
    	var attachmentTypeActionsMenu = Ext.create('Ext.menu.Menu',{
    		items: attachmentTypeActions
    	});
    	
    	var attachmentMenu = Ext.create('Ext.menu.Menu',{
    		items: [this.actions.removeAttachment]
    	});
    	
    	var controllerMenu = Ext.create('Ext.menu.Menu',{
    		items: attachmentTypeActions.concat(['-',this.actions.removeController])
    	});
    	
    	// Make sure these aren't left behind
    	this.on('destroy',function() {
    		Ext.each([controllerTypeActionsMenu, attachmentTypeActionsMenu,
    		          attachmentMenu, controllerMenu],function(m) { Ext.destroy(m); });
    	});
    	
    	this.actions = Ext.Object.merge(this.actions, {
    		
    		addController : new Ext.Action({
    			icon: 'images/vbox/controller_add_16px.png',
    			handler: function(btn) {
    			    var coords = btn.getXY();
    			    coords[1] = coords[1] + btn.getHeight();
    			    controllerTypeActionsMenu.showAt(coords);
    			}
    		}),
    		addAttachment: new Ext.Action({
    			icon: 'images/vbox/attachment_add_16px.png',
    			text: 'Add Attachment',
    			handler: function(btn) {
    				
    				// If there is only one visible item, don't show the menu
    				// just run the item handler
    				var bus = this.tree.getSelectionModel().getSelection()[0].raw.bus;
    				if(vcube.utils.vboxStorage[bus].driveTypes.length == 1) {
    					var action = this.actions['add' + (vcube.utils.vboxStorage[bus].driveTypes[0]) + 'Attachment'].initialConfig;
    					action.handler(action);
    					return;
    				}

    				var coords = btn.getXY();
    			    coords[1] = coords[1] + btn.getHeight();
    			    attachmentTypeActionsMenu.showAt(coords);
    			},
    			scope: this
    		})
    	
    	});

    	
    	/**
    	 * Storage tree panel
    	 */
    	this.tree = Ext.create('Ext.tree.Panel',{
    		xtype: 'treepanel',
    		cls: 'storageTree',
    		scroll: 'vertical',
    		rootVisible: false,
    		hideHeaders: true,
    		border: false,
    		viewConfig: {
    			markDirty: false,
    			expanderSelector: '.storageTreeExpander'
    		},
    		columns : [{
                 xtype    : 'treecolumn',
                 text     : 'Name',
                 dataIndex: 'text',
                 flex: 1,
                 renderer: function(val,m,record) {
                	 if(record.get('leaf')) {
                		 var medium = record.get('medium');
                		 return vcube.utils.vboxMedia.getName(medium && medium.base ? medium.base : medium);
                	 }
                	 return 'Controller: ' + Ext.String.htmlEncode(val);
                 }
    		},{
    			dataIndex: 'leaf',
    			cls: 'gridCellButtons',
    			width: 42,
    			padding: '0 2 0 0',
    			renderer: function(val, meta, record) {
    				
    				if(val) return '';
    				
    				var self = this;
    				
    				var id = record.internalId+'-'+Ext.id();
    				
    				Ext.Function.defer(function() {
    					
    					Ext.each(vcube.utils.vboxStorage[record.raw.bus].driveTypes, function(dt) {
    						Ext.create('Ext.button.Button',Ext.Object.merge({
    								renderTo: document.getElementById(id),
    								baseAction: self.actions['add' + dt + 'Attachment']
    							},
    							self.actions['add' + dt + 'Attachment'].initialConfig));
    					});
    				},1000);
    				
    				return '<div class="buttonContainer" id="'+id+'"></div>';
    				
    			},
    			scope: this
    	            
    		}],
    		listeners: {
    			
    			// Context menu for tree
    			containercontextmenu: function(t, e) {
		    		e.stopEvent();
		    		controllerTypeActionsMenu.showAt(e.getXY());
    			},
    			
    			// Context menu for item
    	    	itemcontextmenu: function(t,r,i,index,e) {
    	    		e.stopEvent();
    	    		if(r.raw.mediumAttachments) {
    	    			controllerMenu.showAt(e.getXY());
    	    		} else {
    	    			attachmentMenu.showAt(e.getXY());
    	    		}

    	    	},

    			
    			// Update actions on selection change
    			selectionchange: function(sm, selected) {
    				
    				var self = this;
    				
    				// Disable all actions at first
    				Ext.iterate(this.actions, function(k,v) {
    					// add controllers are handled elsewhere
    					if(k == 'removeController' || k.indexOf('Controller') == -1) v.disable();
    				});

    				// No Selection
    				if(!selected[0]) {
    				
    					this.actions['addAttachment'].disable();
    					
					// Controller select
    				} else if(selected[0].raw.mediumAttachments) {
    					

    					this.actions['removeController'].enable();
    					
    					// hide all unsupported device types
    					Ext.each(['HardDisk','DVD','Floppy'], function(dt) {
    						self.actions['add' + dt + 'Attachment'].setHidden(!Ext.Array.contains(vcube.utils.vboxStorage[selected[0].raw.bus].driveTypes, dt));
    					});
    					
    					// Disable all at first
    					Ext.each(vcube.utils.vboxStorage[selected[0].raw.bus].driveTypes, function(dt){
							self.actions['add' + dt + 'Attachment'].disable();
						});

    					// We have not hit the max device count yet
    					if(selected[0].childNodes.length != (vcube.utils.vboxStorage[selected[0].raw.bus].maxPortCount
    							* vcube.utils.vboxStorage[selected[0].raw.bus].maxDevicesPerPortCount)) {
    						
    						this.actions['addAttachment'].enable();
    						
    						Ext.each(vcube.utils.vboxStorage[selected[0].raw.bus].driveTypes, function(dt){
    							self.actions['add' + dt + 'Attachment'].enable();
    						});
    					}
    					
    					
    				// Medium attachment select
    				} else {
    					
    					this.actions['removeAttachment'].enable();
    					
    				}
    				
    			},
    			scope: this
    		},
    		store: Ext.create('Ext.data.TreeStore',{
    			
    			fields: [
    			         {name: 'leaf', type: 'boolean'},
    			         {name:'expanded', type: 'boolean'},
    			         'text','icon','iconCls',
    			         {name: 'temporaryEject', type: 'boolean'},
    			         {name: 'passthrough', type: 'boolean'},
    			         {name: 'nonRotational', type: 'boolean'},
    			         'medium',
    			         {name:'port', type: 'int'},
    			         {name: 'portCount', type: 'int'},
    			         {name:'device', type: 'int'},
    			         'type',
    			         'medium',
    			         'bus',
    			         {name:'useHostIOCache', type: 'boolean'},
    			         'name',
    			         'controllerType'],

		         listeners: {
	    				collapse: function(node) {
	    					if(node.raw.bus)
	    						node.set('icon','images/vbox/' + vcube.utils.vboxStorage.getBusIconName(node.raw.bus) + '_expand_16px.png');
	    				},
	    				expand: function(node) {
	    					if(node.raw.bus)
	    						node.set('icon','images/vbox/' + vcube.utils.vboxStorage.getBusIconName(node.raw.bus) + '_collapse_16px.png');
	    				}
	    			}

    		}),
			dockedItems: [{
			    xtype: 'toolbar',
			    dock: 'bottom',
			    items: ['->',this.actions.addAttachment, this.actions.removeAttachment, this.actions.addController, this.actions.removeController],
			    listeners: {
			    	// remove text and make them tooltips
			    	afterrender: function(tbar) {
						Ext.each(tbar.items.items,function(item) {
							if(item.text) {
								item.setTooltip(item.text);
								item.setText('');
							}
						})
			    	}
			    }
    		}]
    	});
    	
    	/*
    	 * tool tips 
    	 */
    	var treeView = this.tree.getView();
    	treeView.on('render', function(view) {
    		
	    	view.tip = Ext.create('Ext.tip.ToolTip', {
	    		
		        // The overall target element.
		        target: treeView.el,
		        // Each grid row causes its own seperate show and hide.
		        delegate: treeView.itemSelector,
		        // Moving within the row should not hide the tip.
		        trackMouse: true,
		        // Render immediately so that tip.body can be referenced prior to the first show.
		        renderTo: Ext.getBody(),
		        listeners: {
		            // Change content dynamically depending on which element triggered the show.
		        	
		            beforeshow: function(tip) {
		            	
		            	var record = treeView.getRecord(Ext.get(tip.triggerEvent.target).findParentNode(treeView.itemSelector));
	
		            	if(!record) return false;
		            	
	
		            	// Medium attachment
		            	if(record.get('leaf')) {
	
		            		var medium = record.get('medium');
		            		var attachedTo = function(medium) {
		            			return '<br />Attached to: ' + (medium.attachedTo ? medium.attachedTo : '<i>Not Attached</i>');
		            		}
		            		
		            		if(!medium) {
		            			tip.update('<b>No disk image file selected</b><br /><br />You can also change this while the machine is running.');
		            		} else {
		            			
		            			var tipText = '';
		            			switch(medium.deviceType) {
		            			
			            			case 'HardDisk':
			            				
			            				
			            				// Base info
			            				tipText = '<b>' + medium.base.location + '</b><br />' +
				            				'Type (Format): ' + medium.base.type + ' (' + medium.base.format + ')'+
				            				attachedTo(medium.base);


			            				// Is already attached using a differencing disk
			            				if(medium.base && medium.base.id != medium.id && this.attachedMedia[medium.id]) {

			            					tipText += '<hr />This base hard disk is indirectly attached using the following differencing hard disk:<br />'+
			            						'<b>' + medium.location + '</b><br />'+
					            				'Type (Format): ' + medium.base.type + ' (' + medium.base.format + ')'+
					            				attachedTo(medium);
			            				
			            				// Disk is readOnly, and not attached
			            				} else if(medium.readOnly && !this.attachedMedia[medium.id]) {
			            					tipText += '<hr />Attaching this hard disk will be performed indirectly using a newly created differencing hard disk.';
			            				}
			            				
			            				break;
			            				
			            			default:
			            				if(medium.hostDrive) {
			            					tipText = '<b>' + vcube.utils.vboxMedia.getName(medium) + '</b>';
			            				} else {
			            					tipText = '<b>' + medium.location + '</b>';
			            				}
			            				tipText += attachedTo(medium);
		            			}
		            			tip.update(tipText);	            			
		            		}
		            		
		            	// Controller
		            	} else {
		            		tip.update('<b>' + Ext.String.htmlEncode(record.get('name')) + '</b><br />'+
		            				'Bus: ' + record.raw.bus + '<br />' +
		            				'Type: ' + vcube.utils.vboxStorage.getControllerType(record.get('controllerType')))
		            	}
		            	
		            },
		            scope: this
		        }
		    });

    	}, this);
    	
    	/*
    	 * Check box listener
    	 */
    	var cbListener = {
			change: function(cb, val) {
				this.tree.getSelectionModel().getSelection()[0].set(cb.name, val);
			},
			scope: this
    	};
    	

    	/*
    	 *	Controller Info Panel 
    	 */
    	var controllerInfoPanel = Ext.create('vcube.form.Panel',{
    		hidden: true,
    		frame: false,
    		border: false,
    		items: [{
    			xtype: 'fieldset',
    			title: 'Attributes',
    			layout: 'form',
    			defaults: {
    				labelAlign: 'right',
    				labelWidth: 80
    			},
    			items: [{
    				fieldLabel: 'Name',
    				xtype: 'textfield',
    				name: 'name',
    				enableKeyEvents: true,
    				allowBlank: false,
    				listeners: {
    					change: function(txt, val) {
    						this.tree.getSelectionModel().getSelection()[0].set({
    							text : val,
    							name: val
    						});
    					},
    					scope: this
    				}
    			},{
    				fieldLabel: 'Type',
    				name: 'controllerType',
    				xtype: 'combo',
    				displayField: 'name',
    				valueField: 'value',
    				editable: false,
    				lastQuery: '',
    				store: Ext.create('Ext.data.Store',{
    					fields: ['name','value'],
    					data: []
    				}),
    				listeners: {
    					change: function(cbo, val) {
    						this.tree.getSelectionModel().getSelection()[0].set('controllerType', val);
    					},
    					scope: this
    				}
    			},{
    				xtype: 'numberfield',
    				fieldLabel: 'Port Count',
    				minValue: 1,
    				maxValue: 30,
    				name: 'portCount',
    				listeners: {
    					change: function(cbo, val) {
    						if(val >= cbo.minValue && val <= cbo.maxValue)
    							this.tree.getSelectionModel().getSelection()[0].set('portCount', val);
    					},
    					scope: this
    				},
    			},{
    				xtype: 'checkbox',
    				inputValue: true,
    				fieldLabel: ' ',
    				labelSeparator: '',
    				boxLabel: 'Use Host I/O Cache',
    				name: 'useHostIOCache',
    				listeners: cbListener
    			}]
    			
    		}]
    	});
    	
    	/* Renderer generator */
    	var ifVal = function(fn, asInt) {
    		return function(val) {
    			if(val !== '' && ((asInt && vcube.utils.toInt(val) > 0) || !asInt)) return (fn ? fn(val) : val);
    			return '--';    			
    		}
    	}
    	
    	/* 
    	 * Slot combo config data
    	 */
    	var slotCbo = {
			xtype: 'combo',
			displayField: 'name',
			valueField: 'value',
			editable: false,
			name: 'slot',
			lastQuery: '',
			value: null,
			store: Ext.create('Ext.data.Store',{
				autoload: false,
				remoteSort: false,
				remoteFilter: false,
				data: [],
				fields: ['name', 'value']
			}),
			listeners: {
				change: function(cbo, val) {
					var slot = val.split('-');
					this.tree.getSelectionModel().getSelection()[0].set({
						port: slot[0],
						device: slot[1]
					});
				},
				scope: this
			}
    	};
    	
    	/*
    	 * Floppy disk Info panel
    	 */
    	var fdInfoPanel = Ext.create('vcube.form.field.storage.AttachmentInfoPanel',{
    		defaults: {
    			xtype: 'fieldset',
    			layout: 'form',
    			value: '',
				defaults: {
					labelAlign: 'right',
					labelWidth: 80,
					xtype: 'displayfield',
					value: '',
				}
    		},
    		items: [{
    			title: 'Attributes',
    			items: [{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				items: [
    					Ext.Object.merge({labelAlign: 'right', fieldLabel: 'Floppy Drive', flex: 1, labelWidth: 80}, slotCbo),
    					{
    						xtype: 'MediaSelectButton',
    						itemId: 'mediaselect',
    						mediaType: 'fd'
    					}
    				]
    			}]
    		},{
    			title: 'Information',
    			itemId: 'mediumInfo',
    			items: [{
		        	fieldLabel: 'Type',
		        	name: 'medium.hostDrive',
		        	renderer: ifVal(function(v){
		        		if(v == '--') return v;
		        		return (v == "false" ? 'Image' : 'Host Drive');
		        	})
		        },{
		        	fieldLabel: 'Size',
		        	name: 'medium.size',
		        	renderer: ifVal(vcube.utils.bytesConvert, true)
		        },{
		        	fieldLabel: 'Location',
		        	name: 'medium.location',
		        	renderer: ifVal(function(a) {
		        		return Ext.String.ellipsis(a, 60);
		        	})
		        },{
		        	fieldLabel: 'Attached to',
		        	name: 'medium.attachedTo',
		        	renderer: ifVal(function(a) {
		        		return Ext.String.ellipsis(a, 60);
		        	})
		        }]
    		}]
    	});

    	/*
    	 * CD / DVD Info panel
    	 */
    	var cdInfoPanel = Ext.create('vcube.form.field.storage.AttachmentInfoPanel',{
    		
    		items: [{
    			title: 'Attributes',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				value: '',
    			},
    			items: [{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				items: [
    					Ext.Object.merge({labelAlign: 'right', fieldLabel: 'CD/DVD Drive', flex: 1}, slotCbo),
    					{
    						xtype: 'MediaSelectButton',
    						itemId: 'mediaselect',
    						mediaType: 'cd'
    					}
    				]
    			},{
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				inputValue: true,
    				boxLabel: 'Live CD/DVD',
    				name: 'temporaryEject',
    				itemId: 'temporaryEject',
    				listeners: cbListener,
    				showTest: function(a) {
    					return (!a.medium || !a.medium.hostDrive);
    				}
    			},{
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				inputValue: true,
    				boxLabel: 'Passthrough',
    				name: 'passthrough',
    				itemId: 'passthrough',
    				listeners: cbListener,
    				showTest: function(a) {
    					return (a.medium && a.medium.hostDrive);
    				}
    			}]
    		},{
    			title: 'Information',
    			itemId: 'mediumInfo',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				labelWidth: 80,
    				value: '',
    			},
    			items: [{
    				fieldLabel: 'Type',
    				name: 'medium.hostDrive',
		        	renderer: ifVal(function(v){
		        		if(v == '--') return v;
		        		return (v == "false" ? 'Image' : 'Host Drive');
		        	})

    			},{
    				fieldLabel: 'Size',
    				name: 'medium.size',
    				renderer: ifVal(vcube.utils.bytesConvert, true)
    			},{
    				fieldLabel: 'Location',
    				name: 'medium.location',
    				renderer: ifVal(function(a) {
		        		return Ext.String.ellipsis(a, 60);
		        	})
    			},{
    				fieldLabel: 'Attached to',
    				name: 'medium.attachedTo',
    				renderer: ifVal(function(a) {
		        		return Ext.String.ellipsis(a, 60);
		        	})	
    			}]
    		}]
    	});
    	
    	/*
    	 * Hard disk info panel
    	 */
    	var hdInfoPanel = Ext.create('vcube.form.field.storage.AttachmentInfoPanel',{
    		items: [{
    			title: 'Attributes',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				value: ''
    			},
    			items: [{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				items: [
    					Ext.Object.merge({labelAlign: 'right', fieldLabel: 'Hard Disk', flex: 1}, slotCbo),
    					{
    						xtype: 'MediaSelectButton',
    						itemId: 'mediaselect',
    						mediaType: 'hd'
    					}
    				]
    			},{
		        	fieldLabel: ' ',
		        	labelSeparator: '',
		        	boxLabel: 'Solid-state Drive',
		        	xtype: 'checkbox',
		        	inputValue: true,
		        	name: 'nonRotational',
		        	listeners: cbListener
		        }]
    		},{
    			title: 'Information',
    			itemId: 'mediumInfo',
    			defaults: {
    				labelAlign: 'right',
    				xtype: 'displayfield',
    				labelWidth: 90
    			},
    			items: [{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
    				fieldLabel: 'Type (Format)',
    				border: true,
        			defaults: {
        				xtype: 'displayfield',
        				border: true
        			},
        			items: [{
        				name: 'medium.type',
        				renderer: ifVal()        				
        			},{
        				name: 'medium.format',
        				renderer: ifVal(function(v) {
        					return '&nbsp;(' + v + ')';
        				})
        			}]
	    		},{
	    			fieldLabel: 'Virtual Size',
	    			name: 'medium.logicalSize',
	    			renderer: ifVal(vcube.utils.mbytesConvert, true)
	    		},{
	    			fieldLabel: 'Actual Size',
	    			name: 'medium.size',
	    			renderer: ifVal(vcube.utils.bytesConvert, true)
	    		},{
	    			fieldLabel: 'Details',
	    			name: 'medium.variant',
	    			renderer: function(v) {
	    				return vcube.utils.vboxMedia.getHardDiskVariant(vcube.utils.toInt(v));
	    			}
	    		},{
	    			fieldLabel: 'Location',
	    			name: 'medium.base.location',
	    			renderer: ifVal(function(a) {
		        		return Ext.String.ellipsis(a, 60);
		        	})
	    		},{
	    			fieldLabel: 'Attached to',
	    			name: 'medium.base.attachedTo',
	    			renderer: ifVal(function(a) {
		        		return Ext.String.ellipsis(a, 60);
		        	})
	    		}]
    		}]
    	});

    	
    	this.tree.on('selectionchange', function(sm, selection) {
    		var self = this;
    		Ext.each(this.attribsPanel.items.items, function(p) {
    			p.hide();
    		});
    		
    		if(!selection.length) {
    			this.attribsPanel.items.items[0].show();
    			return;
    		}
    		
    		var targetPanel = null;

    		// Controller
    		if(!selection[0].get('leaf')) {
    			
    			targetPanel = controllerInfoPanel;
    			
    			// Load controller types combo
    			controllerInfoPanel.down('[name=controllerType]').getStore().loadData(vcube.utils.vboxStorage.getControllerTypes(selection[0].raw.bus));
    			
    			// Setup port count
    			if(vcube.utils.vboxStorage[selection[0].raw.bus].configurablePortCount) {
    				
    				var f = controllerInfoPanel.down('[name=portCount]');
    				
    				var maxPortNum = 0;
    				
    				Ext.each(selection[0].childNodes, function(node) {
    					maxPortNum = Math.max(maxPortNum, (node.get('port')+1));
    				});
    				// Set min and max values
    				f.setMinValue(Math.max(1,maxPortNum));
    				f.setMaxValue(vcube.utils.vboxStorage[selection[0].raw.bus].maxPortCount);
    				f.show();
    				
    				
    			} else {
    				controllerInfoPanel.down('[name=portCount]').hide();
    			}
    			
    	   		targetPanel.getForm().setValues(Ext.Object.merge({},selection[0].raw, selection[0].getData()), true);
        		targetPanel.show();
     
    			
    		// Medium attachment
    		} else {
    			
    			switch(selection[0].raw.type) {
	    			case 'Floppy':
	    				targetPanel = fdInfoPanel;
	    				break;
	    			case 'DVD':
	    				targetPanel = cdInfoPanel;
	    				break;
	    			default:
	    				targetPanel = hdInfoPanel;
    			}
    			
    			// Get used slots
    			var usedSlots = {};
    			selection[0].parentNode.eachChild(function(n) {
    				if(n.internalId != selection[0].internalId) {
    					usedSlots[n.get('port') + '-' + n.get('device')] = true;
    				}
    			});
    			
    			// Populate with unused slots
    			var slots = [];
    			Ext.iterate(vcube.utils.vboxStorage[selection[0].parentNode.raw.bus].slots(), function(k,v) {
    				if(!usedSlots[k])
    					slots.push({name: v, value: k});
    			});
    			
    			targetPanel.down('[name=slot]').getStore().loadData(slots);
    			
    			targetPanel.updatePanel.call(targetPanel, selection[0].getData());
    			
    			targetPanel.show();
    		}
 
    		
    	}, this);
    	
    	this.attribsPanel = Ext.create('Ext.panel.Panel',{
    		layout: 'fit',
    		margin: '0 6 0 6',
    		frame: false,
    		border: false,
    		cls: 'greyPanel',
    		defaults: {
    			cls: 'greyPanel',
    			border: false
    		},
    		items: [ {padding: 8, html: 'The Storage Tree can contain several controllers of different types. This machine currently has no controllers.'},
    		        controllerInfoPanel, cdInfoPanel, fdInfoPanel, hdInfoPanel]
    	})
    	
    	this.childComponent = Ext.create('Ext.panel.Panel',{
    		
    		title: 'Storage',
    		height: 300,
    		frame: false,
    		border: true,
    		layout: {
    			type: 'border'
    		},
    		ownerCt: this,
    		defaults: {
    		    split: true,
    		    layout: 'fit',
    		    frame: false,
    		    border: false
    		},
    		items: [{
    			xtype: 'panel',
    			region: 'center',
    			height: 200,
    			width: 200,
    			items: [{
    				xtype: 'panel',
    				layout: 'fit',
    				cls: 'greyPanel',
    				border: false,
    				items: [{
    					xtype: 'fieldset',
    					title: 'Storage Tree',
    					layout: 'fit',
    					margin: 4,
    					border: true,
    					cls: 'greyPanel',
    					items: [this.tree]			
    				}]
    			}]
    		},{
    			xtype: 'panel',
        		region: 'east',
        		width: 310,
        		cls: 'greyPanel',
        		layout: 'fit',
    			items: [this.attribsPanel]
    		}]

    	});

    	this.callParent(arguments);
    	
    	this.on('destroy', function() {
    		Ext.destroy(this.childComponent);
    		this.cachedMedia = {};
    		this.attachedMedia = {};
    	}, this);
    	
    	
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

Ext.define('vcube.form.field.storage.AttachmentInfoPanel', {
	
	extend: 'vcube.form.Panel',
	alias: 'widget.AttachmentInfoPanel',
	
	hidden: true,
	border: false,
	updatePanel: function(attachment) {
		
		this.getForm().setValues(attachment);
		
		// Update media select button
		this.down('.MediaSelectButton').updateMenu(attachment.medium);
		
		// Set correct slot value
		this.down('[name=slot]').setValue(attachment.port + '-' + attachment.device);
		
		// show / hide fields
		Ext.each(this.queryBy(function(f) {
			return (f.showTest ? true : false);
		}), function(f) {
			f.setVisible(f.showTest(attachment));
		});
		
		// Blank out all medium info fields if no medium is set
		if(!attachment.medium) {
			Ext.each(Ext.ComponentQuery.query('.field',this.down('#mediumInfo')), function(f) {
				f.setValue('--');
			});
		}

	},
	defaults: {
		xtype: 'fieldset',
		layout: 'form',
		value: ''
	},
	initComponent: function(options) {
		
		Ext.apply(this, options);
		
		this.callParent(options);
		
		this.down('.MediaSelectButton').on('mediumselect',function(medium) {
			var record = this.up('.storagefield').tree.getSelectionModel().getSelection()[0];
			record.set('medium',medium);
			this.updatePanel(record.getData());
		},this);
	}
});

Ext.define('vcube.form.field.storage.MediaSelectButton',{
	
	alias: 'widget.MediaSelectButton',
	
	extend: 'Ext.button.Button',
	mediaType: 'cd', // One of cd / fd / hd
	
	margin: '2 0 0 4',
		
	drivesAdded: false,
	
	browseLocation: null,
	
	/* Update menu when selection occurs */
	updateMenu: function(media) {
		var empty = this.menu.down('#empty');
		if(media && media.location && !media.hostDrive) {
			this.browseLocation = media.location;
		} else {
			this.browseLocation = null;
		}
		if(!empty) return;
		empty.setDisabled(!media);
	},
	
	/* Browse for media */
	browseMedia: function() {
		
		var self = this;
		var serverId = this.up('.window').serverId;
		
		Ext.ux.Deferred.when(vcube.form.field.storage.browseMedia(this.mediaType, serverId, this.browseLocation)).done(function(data){
			self.fireEvent('mediumselect', data);
		});
		
	},
	
	/* Update recent media with list provided */
	updateRecent: function(recents) {
		
		var self = this;
		
		self.menu.items.each(function(i) {
			if(i.initialConfig._medium_path)
				self.menu.remove(i, true);
		});
		
		var index = this.menu.items.indexOf(this.menu.down('#recentmedia'));
		Ext.each(recents, function(r) {
			self.menu.insert(index++, {
				text: vcube.utils.basename(r),
				_medium_path: r
			});
		});

	},
	
	/* "Recent" media menu item handler */
	onMenuClick: function(menu, item) {
		
		if(!item || !item.initialConfig._medium_path) return;
		
		var serverId = this.up('.window').serverId;
		
		var self = this;
		
		vcube.app.setLoading(true);
		
		var vboxMediaType = 'HardDisk';
		if(self.mediaType == 'fd') {
			vboxMediaType = 'Floppy';
		} else if (self.mediaType == 'cd') {
			vboxMediaType = 'DVD';
		}

		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/mediumAdd',{
			
			path:item.initialConfig._medium_path,
			connector: serverId,
			type:vboxMediaType
			
		})).done(function(data) {
			
			vcube.app.localConfig.addToList('recentMedia-' + self.mediaType + '-' + serverId, data.location, vcube.form.field.storage.recentMediaLimit);
			
			self.up('.storagefield').cachedMedia[data.id] = data;
			
			
			self.fireEvent('mediumselect', data);
			self.updateMenu(data);
			
			
		}).always(function(){
			vcube.app.setLoading(false);
		});

	},
	
	/* Load data into menu. Host drives and recent media */
	loadMenu: function() {
		
		var self = this;

		var serverId = this.up('.window').serverId;
			
		// Add recent media
		this.updateRecent(vcube.app.localConfig.get('recentMedia-' + self.mediaType + '-' + serverId) || []);
		
		// HardDisk media does not have host drives option
		if(this.mediaType == 'hd' || this.drivesAdded) return;
		
		this.drivesAdded = true;
		
		// Load host drives
		Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/hostGet'+(this.mediaType == 'fd' ? 'Floppy' : 'DVD') + 'Drives',{connector:serverId})).done(function(drives){
			self.menu.remove('hostdrives', true);
			Ext.each(drives, function(d) {
				self.menu.insert(1, {
					text: vcube.utils.vboxMedia.getName(d),
					_medium: d,
					handler: function(item) {
						self.fireEvent('mediumselect', item.initialConfig._medium);
						self.updateMenu(item.initialConfig._medium);
					},
					scope: self
				})
			});
		});
		
	},
	
	initComponent: function(config) {
		
		Ext.apply(this, config);
		
		switch(this.mediaType) {
		
			// Floppy media
			case 'fd':
				this.icon = 'images/vbox/fd_16px.png',
				
				this.menu = {
					items: [{
						text: 'Choose a virtual floppy disk file...',
						icon: 'images/vbox/select_file_16px.png',
						handler: function() {
							this.browseMedia();
						},
						scope: this
					},{
						text: 'Loading host drives...',
						itemId: 'hostdrives'
					},{
						itemId: 'recentmedia',
						hidden: true
					},
					'-',
					{
						text: 'Remove disk from virtual drive',
						itemId: 'empty',
						icon: 'images/vbox/fd_unmount_16px.png',
						handler: function() {
							this.fireEvent('mediumselect', null);
							this.updateMenu(null);
						},
						scope: this
					}],
					listeners: {
						beforeshow: function() {
							this.loadMenu();
						},
						click: this.onMenuClick,
						scope: this
					}
				};
								
				break;
				
			// CD/DVD media
			case 'cd':
				this.icon = 'images/vbox/cd_16px.png',
				this.menu = {
					items: [{
						text: 'Choose a virtual CD/DVD disk file...',
						icon: 'images/vbox/select_file_16px.png',
						handler: function() {
							this.browseMedia();
						},
						scope: this
					},{
						text: 'Loading host drives...',
						itemId: 'hostdrives'
					},{
						itemId: 'recentmedia',
						hidden: true
					},
					'-',
					{
						text: 'Remove disk from virtual drive',
						itemId: 'empty',
						icon: 'images/vbox/cd_unmount_16px.png',
						handler: function() {
							this.fireEvent('mediumselect', null);
							this.updateMenu(null);
						},
						scope: this
					}],
					listeners: {
						beforeshow: function() {
							this.loadMenu();
						},
						click: this.onMenuClick,
						scope: this
					}
				};
				
				break;
				
			// Hard disk
			default:
				this.icon = 'images/vbox/hd_16px.png',
				this.menu = {
					items: [{
						text: 'Create a new hard disk...',
						icon: 'images/vbox/vdm_new_16px.png',
						handler: function() {
							
						},
						scope: this
					},{
						text: 'Choose a virtual hard disk file...',
						icon: 'images/vbox/select_file_16px.png',
						handler: function() {
							this.browseMedia();
						},
						scope: this
					},{
						itemId: 'recentmedia',
						hidden: true
					}],
					listeners: {
						beforeshow: function() {
							this.loadMenu();
						},
						click: this.onMenuClick,
						scope: this
					}
			};
				
		}
		
		this.callParent(arguments);
		
				
	}
});