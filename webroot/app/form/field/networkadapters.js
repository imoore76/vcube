Ext.define('vcube.form.field.networkadapters', {
    extend: 'Ext.form.field.Base',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.networkadaptersfield',
    combineErrors: true,
    border: false,
    padding: 0,
    margin: 0,
    msgTarget: 'side',
    submitFormat: 'c',
    
    maxAdapters: 8,
    
    natEngines: [],
    
    serverId: null,
    
    /* Stores */
    networkAdapterTypeStore: Ext.create('vcube.data.VboxEnumStore',{
		enumClass: 'NetworkAdapterType',
		conversionFn: vcube.utils.vboxNetworkAdapterType,
		ignoreNull: true
	}),
	
	networkAttachmentTypeStore: Ext.create('vcube.data.VboxEnumStore',{
		enumClass: 'NetworkAttachmentType',
		conversionFn: vcube.utils.vboxNetworkAttachmentType
	}),
	
	promiscPolicyModeStore: Ext.create('vcube.data.VboxEnumStore',{
		enumClass: 'NetworkAdapterPromiscModePolicy',
		conversionFn: vcube.utils.vboxNetworkPromiscPolicy,
		ignoreNull: true
	}),
	
	bridgedInterfacesStore: Ext.create('Ext.data.Store',{
		autoload: false,
		remoteSort: false,
		remoteFilter: false,
		fields: ['display','value']
	}),
	
	hostOnlyInterfacesStore: Ext.create('Ext.data.Store',{
		autoload: false,
		remoteSort: false,
		remoteFilter: false,
		fields: ['display','value']
	}),
	
	internalNetworksStore: Ext.create('Ext.data.Store',{
		autoload: false,
		remoteSort: false,
		remoteFilter: false,
		fields: ['display','value']
	}),
	
	natNetworksStore: Ext.create('Ext.data.Store',{
		autoload: false,
		remoteSort: false,
		remoteFilter: false,
		fields: ['display','value']
	}),
	
	genericDriversStore: Ext.create('Ext.data.Store',{
		autoload: false,
		remoteSort: false,
		remoteFilter: false,
		fields: ['display','value']
	}),
	
	/**
	 * NAT engine properties editor window config
	 */
    natEnginePropsEditor: {
    	title: 'NAT Engine',
    	icon: 'images/vbox/nw_16px.png',
    	height: 300,
    	width: 600,
    	modal: true,
    	layout: 'fit',
    	items: [{
    		xtype: 'tabpanel',
    		frame: true,
    		layout: 'fit',
    		items: [{
    			title: 'Properties',
    			xtype: 'form',
    			layout: 'form',
    			frame: true,
    			defaults: {
    				xtype: 'textfield',
    				labelAlign: 'right'
    			},
    			items: [{
    				fieldLabel: 'Alias Mode',
    				xtype: 'checkbox',
    				name: 'aliasModeProxy',
    				boxLabel: 'Proxy Only'
    			},{
    				xtype: 'checkbox',
    				fieldLabel: ' ',
    				labelSeparator: '',
    				name: 'aliasModeSame',
    				boxLabel: 'Same Ports'
    			},{
    				boxLabel: 'DNS Pass Domain',
    				fieldLabel: 'Options',
    				xtype: 'checkbox',
    				name: 'DNSPassDomain'
    			},{
    				boxLabel: 'DNS Proxy',
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				name: 'DNSProxy'
    			},{
    				boxLabel: 'Use Host Resolver',
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				name: 'DNSUseHostResolver'
    			},{
    				fieldLabel: 'Host IP',
    				name: 'hostIP',
    				inputWidth: 200,
    				maskRe: /[\d\.]/
    			}]
    		},{
    			title: 'Port Forwarding Rules',
    			xtype: 'gridpanel',
    			frame: true,
    			layout: 'fit',
    			plugins: [Ext.create('Ext.grid.plugin.CellEditing', {
    		        clicksToEdit: 1
    		    })],
    		    viewConfig: {
    		    	markDirty: false
    		    },
    			listeners: {
    				selectionchange: function(sm, selection) {
    					if(selection.length) {
    						this.down('#remove').enable();
    					} else {
    						this.down('#remove').disable();
    					}
    				}
    			},
    			store: Ext.create('Ext.data.Store',{
    				fields: [
    				   {name: 'name', type: 'string'},
    				   {name: 'protocol', type: 'int'},
    				   {name: 'hostip', type: 'string'},
    				   {name: 'hostport', type: 'int'},
    				   {name: 'guestip', type: 'string'},
    				   {name: 'guestport', type: 'int'}
    				]
    			}),
    			columns: [{
    				header: 'Name',
    				dataIndex: 'name',
    				renderer: function(v) {
    					return Ext.String.htmlEncode(v);
    				},
    				editor: {
    					xtype: 'textfield',
    					allowBlank: false,
    					maskRe: /[^,]/,
    					listeners: {
    						change: function(txt,v) {
    							if(v.indexOf(',') > -1) {
    								txt.setValue(v.replace(/,/g,''));
    							}
    						}    						
    					}
    				}
    			},{
    				header: 'Protocol',
    				dataIndex: 'protocol',
    				width: 75,
    				renderer: function(val) {
    					return (val ? 'TCP' : 'UDP');
    				},
    				editor: {
    					xtype: 'combo',
    					store: [
		                    [1,'TCP'],
		                    [0,'UDP']
		                ],
		                lazyRender: true,
		                editable: false,
		                listClass: 'x-combo-list-small'
    				}
    			},{
    				header: 'Host IP',
    				dataIndex: 'hostip',
    				editor: {
    					xtype: 'textfield',
    					validator: function(ip) {
    						if(/^[1-9][0-9]{0,2}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
    	    				return 'Must be a numeric IP address';
    	    			},
    	    			maskRe: /[\d\.]/

    				}
    			},{
    				header: 'Host Port',
    				dataIndex: 'hostport',
    				width: 75,
    				editor: {
    					xtype: 'numberfield',
    	                allowBlank: false,
    	                minValue: 0,
    	                maxValue: 65535
    				}
    			},{
    				header: 'Guest IP',
    				dataIndex: 'guestip',
    				editor: {
    					xtype: 'textfield',
    					validator: function(ip) {
    	    				if(/^[1-9][0-9]{0,2}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) return true;
    	    				return 'Must be a numeric IP address';
    	    			},
    	    			maskRe: /[\d\.]/

    				}
    			},{
    				header: 'Guest Port',
    				dataIndex: 'guestport',
    				width: 75,
    				editor: {
    					xtype: 'numberfield',
    	                allowBlank: false,
    	                minValue: 0,
    	                maxValue: 65535
    				}
    			}],
    			rbar: [{
    				icon: 'images/vbox/controller_add_16px.png',
    				listeners: {
    					click: function(btn) {
    						var store = btn.ownerCt.ownerCt.getStore();
    						var nameTpl = 'Rule ';
    						var num = store.getCount() + 1;
    						var name = nameTpl + (num++);
    						while(store.findRecord('name',name)) {
    							name = nameTpl + (num++);
    						}
    						store.add({'name':name,'protocol':1});
    					}
    				}
    			},{
    				icon: 'images/vbox/controller_remove_16px.png',
    				itemId: 'remove',
    				disabled: true,
    				listeners: {
    					click: function(btn) {
    						var selection = btn.ownerCt.ownerCt.getSelectionModel().getSelection()[0];
    						var store = btn.ownerCt.ownerCt.getStore();
    						var idx = store.indexOf(selection);
    						
    						btn.ownerCt.ownerCt.getStore().remove(selection);
    						
    						if(idx >= store.getCount()) idx--;
    						if(idx >= 0)
    							btn.ownerCt.ownerCt.getSelectionModel().select(idx);
    					}
    				}
    			}]
    		}]
    	}],
    	
    	buttons: [{
    		text: 'OK',
    		itemId: 'ok'
    	},{
    		text: 'Cancel',
    		itemId: 'cancel',
    		listeners: {
    			click: function(btn) {
    				btn.up('.window').close();
    			}
    		}
    	}]
    },
    
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
    	var netData = this.up('.window')._data[this.name];
    	
    	for(var i = 0; i < netData.length; i++) {
    		
    		var tab = self.childComponent.items.items[i];
    		
    		Ext.iterate(netData[i], function(k,v) {
    			var f = tab.down('[name=netAdapter-'+k+'-'+i+']');
    			if(f)
    				netData[i][k] = Ext.isObject(netData[i][k]) ? Ext.Object.merge(netData[i][k], f.getValue()) : f.getValue();
    		});
    		
    		// Add NATEngine data
    		netData[i]['NATEngine'] = this.natEngines[i];
    	}
    	return netData
    },
    
    setValue: function(val) {
    	
    	if(!val) val = [];
    	for(var i = 0; i < Math.min(val.length,this.maxAdapters); i++) {
    		var tab = this.childComponent.items.items[i];
    		Ext.iterate(val[i], function(k, v) {
    			var f = tab.down('[name=netAdapter-'+k+'-'+i+']');
    			if(f && f.setValue) f.setValue(v);
    		});
    		
    		this.natEngines[i] = val[i].NATEngine;
    	}
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.childComponent = Ext.create('Ext.tab.Panel',{
    		title: 'Network',
    		frame: true,
    		padding: 6,
    		layout: 'form',
    		defaults: {
    			frame: true,
    			padding: 6,
    			layout: 'form',
    			submitValue: false,
    			fieldDefaults: {
    				labelAlign: 'right'
    			}
    		},
    	    border: false
    	});
    	
    	for(var i = 0; i < this.maxAdapters; i++) {
    		
    		this.childComponent.add({
    			title: 'Adapter ' + (i+1),
    			frame: true,
    			layout: 'form',
    			defaults: {
    				labelWidth: 130,
    				labelAlign: 'right',
    				disabled: true
    			},
    			items: [{
    				xtype: 'checkbox',
    				inputValue: true,
    				boxLabel: 'Enable Network Adapter',
    				name: 'netAdapter-enabled-'+i,
    				disabled: false,
    				listeners: {
    					change: function(cb, val) {
    						Ext.each(cb.ownerCt.items.items, function(item){
    							if(item.name != cb.name) {
    								item.setDisabled(!val);
    							}
    							if(val) {
    								var at = cb.ownerCt.down('#attachmentType');
    								at.fireEvent('change', at, at.getValue(), null);
    							}
    						})
    					}
    				}
    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Attached to',
    				name: 'netAdapter-attachmentType-'+i,
    				itemId: 'attachmentType',
    				displayField: 'display',
    				valueField: 'value',
    				store: this.networkAttachmentTypeStore,
    				lastQuery: '',
    				listeners: {
    					change: function(cbo, val) {
    						

    						Ext.suspendLayouts();
    						
    						var num = cbo.name.split('-').pop();
    						
    						// Enable / disable promisc policy
    						cbo.ownerCt.down('[name=netAdapter-promiscModePolicy-'+num+']').setDisabled(Ext.Array.contains(['Null','NAT','Generic'], val));
    						
    						var cboList = ['bridgedInterface','hostOnlyInterface','internalNetwork','NATNetwork','genericDriver'];

    						Ext.each(cboList, function(name) {
    							cbo.ownerCt.down('[name=netAdapter-'+name+'-'+num+']').hide();
    						});

    						cbo.ownerCt.down('#natengine').hide();
    						cbo.ownerCt.down('#genericproperties').hide();
    						
    						var targetCbo = null;
    						
    						switch(val) {
    							case 'NATNetwork':
    								targetCbo = cbo.ownerCt.down('[name=netAdapter-NATNetwork-'+num+']');
    								break;
    							case 'Generic':
    								cbo.ownerCt.down('#genericproperties').show();
    								targetCbo = cbo.ownerCt.down('[name=netAdapter-genericDriver-'+num+']');
    								break;
    							case 'Internal':
    								targetCbo = cbo.ownerCt.down('[name=netAdapter-internalNetwork-'+num+']');
    								break;
    							case 'HostOnly':
    								targetCbo = cbo.ownerCt.down('[name=netAdapter-hostOnlyInterface-'+num+']');
    								break;
    							case 'Bridged':
    								targetCbo = cbo.ownerCt.down('[name=netAdapter-bridgedInterface-'+num+']');
    								break;
    							case 'NAT':
    								cbo.ownerCt.down('#natengine').show();
    						}
    						
    						if(targetCbo) {
    							
	    						 if(!targetCbo.getValue()) {
	    							try {
	    								targetCbo.setValue(targetCbo.getStore().getAt(0).get('value'))    								
	    							} catch(err) {}
	    						 }
    						
	    						 targetCbo.show();
    						}
    						
    			    		// batch of updates are over
    			    		Ext.resumeLayouts(true);

    					}
    				}
    			},{
    				xtype: 'button',
    				text: 'Configure NAT Engine',
    				itemId: 'natengine',
    				margin: '0 0 0 134',
    				listeners: {
    					
    					click: function(btn) {
    						
    						var dlg = Ext.create('Ext.window.Window',this.natEnginePropsEditor);
    						var store = dlg.down('.gridpanel').getStore();
    						var num = btn.up('.panel').down('.checkbox').name.split('-').pop();
    						
    						var natEngine = this.natEngines[num];
    						
    						dlg.down('.form').getForm().setValues(natEngine);
    						
    						// Set alias mode check boxes
    						dlg.down('[name=aliasModeProxy]').setValue((natEngine.aliasMode & 2) ? true : false);
    						dlg.down('[name=aliasModeSame]').setValue((natEngine.aliasMode & 4) ? true : false);
    						
    						var redirects = [];
    						for(var i = 0; i < natEngine.redirects.length; i++) {
    							var redir = natEngine.redirects[i].split(',');
    							redirects.push({
    								name: redir[0],
    								protocol: redir[1],
    								hostip: redir[2],
    								hostport: redir[3],
    								guestip: redir[4],
    								guestport: redir[5]
    							});
    						}
    						store.loadData(redirects);
    						
    						dlg.down('#ok').on('click',function(btn){
    							
    							var redirects = [];
    							var valid = true;
    							store.each(function(r){
    								
    								if(parseInt(r.get('hostport')) == 0 || parseInt(r.get('guestport')) == 0) {
    									vcube.utils.alert('The current port forwarding rules are not valid. None of the host or guest port values may be set to zero.');
    									valid = false;
    									return false;
    								}
    								
    								redirects.push([r.get('name'),r.get('protocol'),r.get('hostip'),r.get('hostport'),
    								                r.get('guestip'), r.get('guestport')].join(','));
    							});
    							
    							if(!valid) return;
    							
    							var engine = dlg.down('.form').getForm().getValues();
    							
    							engine.aliasMode = 0;
    							
    							if(engine['aliasModeProxy']) engine.aliasMode = engine.aliasMode | 2;
    							if(engine['aliasModeSame']) engine.aliasMode = engine.aliasMode | 4;

    							delete engine['aliasModeSame'];
    							delete engine['aliasModeProxy'];
    							
    							this.natEngines[num] = engine;
    							this.natEngines[num]['redirects'] = redirects;
    							
    							dlg.close();
    						}, this);
    						
    						dlg.show();
    					},
    					scope: this
    				}
    			},{
    				xtype: 'combo',
    				editable: false,
    				hidden: true,
    				fieldLabel: 'Name',
    				name: 'netAdapter-bridgedInterface-'+i,
    				displayField: 'display',
    				valueField: 'value',
    				lastQuery: '',
    				allowBlank: false,
    				store: this.bridgedInterfacesStore
    			},{
    				xtype: 'combo',
    				editable: false,
    				hidden: true,
    				fieldLabel: 'Name',
    				name: 'netAdapter-hostOnlyInterface-'+i,
    				displayField: 'display',
    				valueField: 'value',
    				lastQuery: '',
    				allowBlank: false,
    				store: this.hostOnlyInterfacesStore
    			},{
    				xtype: 'combo',
    				editable: true,
    				hidden: true,
    				fieldLabel: 'Name',
    				name: 'netAdapter-internalNetwork-'+i,
    				displayField: 'display',
    				valueField: 'value',
    				lastQuery: '',
    				allowBlank: false,
    				store: this.internalNetworksStore
    			},{
    				xtype: 'combo',
    				editable: false,
    				hidden: true,
    				fieldLabel: 'Name',
    				name: 'netAdapter-NATNetwork-'+i,
    				displayField: 'display',
    				valueField: 'value',
    				lastQuery: '',
    				allowBlank: false,
    				store: this.natNetworksStore
    			},{
    				xtype: 'combo',
    				editable: true,
    				fieldLabel: 'Name',
    				hidden: true,
    				name: 'netAdapter-genericDriver-'+i,
    				displayField: 'display',
    				valueField: 'value',
    				lastQuery: '',
    				allowBlank: false,
    				store: this.genericDriversStore
    			},{
    				xtype: 'textarea',
    				fieldLabel: 'Generic Properties',
    				itemId: 'genericproperties',
    				name: 'netAdapter-properties-'+i,
        			plugins: [{
        				ptype: 'fieldhelptext',
        				text: 'Enter any configuration settings here for the network attachment driver you are using. The '+
        					'settings should be in the form of <b>name=value</b> and will depend on the driver.'
        			}],
        			setValue: function(v) {
        				
        				this.value = v;
        				if(!this.inputEl) return;
        				
        				var vals = [];
        				Ext.iterate(v, function(k,v) {
        					vals.push(k+'='+v);
        				});
        				this.inputEl.dom.value = vals.join("\n");
        			},
        			getValue: function() {

        				if(!this.inputEl) return this.value;
        				        				
        				var val = this.inputEl.dom.value;        				
        				var retVal = {};
        				Ext.each(val.split("\n"), function(v) {
        					if(v.indexOf('=') > 0 && v.length > 2) {
        						var kv = v.split('=');
        						retVal[kv[0]] = kv[1];
        					}
        				});
        				return retVal;
        			},
        			getSubmitValue: function() {
        				return this.getValue();
        			},
    				hidden: true,
    				height: 48
    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Adapter Type',
    				name: 'netAdapter-adapterType-'+i,
    				displayField: 'display',
    				valueField: 'value',
    				store: this.networkAdapterTypeStore,
    				lastQuery: ''

    			},{
    				xtype: 'combo',
    				editable: false,
    				fieldLabel: 'Promiscuous Mode',
    				name: 'netAdapter-promiscModePolicy-'+i,
    				displayField: 'display',
    				valueField: 'value',
    				store: this.promiscPolicyModeStore,
    				lastQuery: ''
    			},{
    				xtype: 'fieldcontainer',
    				layout: 'hbox',
        			defaults: {
        				labelWidth: 130,
        				labelAlign: 'right'
        			},
    				items: [{
    					xtype: 'textfield',
    					fieldLabel: 'MAC Address',
    					name: 'netAdapter-MACAddress-'+i,
    					itemId: 'macaddress',
    					labelAlign: 'right',
    					maskRe: /[0-9a-fA-F]/
    				},{
    					xtype: 'button',
    					icon: 'images/vbox/refresh_16px.png',
    					margin: '2 0 0 0',
    					border: false,
    					frame: false,
    					listeners: {
    						click: function(btn) {
    							
    							btn.setDisabled(true);
    							btn.ownerCt.down('#macaddress').setDisabled(true);
    							
    							Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/vboxGenerateMacAddress',{connector: this.serverId})).done(function(mac){
    								btn.ownerCt.down('#macaddress').setValue(mac);
    							}).always(function(){
        							btn.setDisabled(false);
        							btn.ownerCt.down('#macaddress').setDisabled(false);
    							});
    						},
    						scope: this
    					}
    				}]
    			},{
    				fieldLabel: ' ',
    				labelSeparator: '',
    				xtype: 'checkbox',
    				inputValue: true,
    				name: 'netAdapter-cableConnected-'+i,
    				boxLabel: 'Cable Connected'
    			}]
    		});
    	}
    	
    	this.childComponent.setActiveTab(0);

    	this.callParent(arguments);	    
	    
	    this.on({
	    	
	    	destroy : function() { Ext.destroy(this.childComponent);},

	    	render: function() {


				this.serverId = this.up('.window').serverId;
				this.networkAdapterTypeStore.setServer(this.serverId);
				this.networkAttachmentTypeStore.setServer(this.serverId);
				this.promiscPolicyModeStore.setServer(this.serverId);
				
				var self = this;
				
				// Load host networking info
				Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/hostGetNetworking',{connector:this.serverId})).done(function(data){
					
					var rootToStore = {
						nics: 'bridgedInterfacesStore',
						genericDrivers: 'genericDriversStore',
						NATNetworks: 'natNetworksStore',
						networks: 'internalNetworksStore',
						hostOnlyNics: 'hostOnlyInterfacesStore'
					};
					
					Ext.iterate(rootToStore, function(k,v) {
						
						var dataToLoad = [];
						Ext.each(data[k], function(item) {
							dataToLoad.push({display: item, value: item});
						});
						
						self[v].loadData(dataToLoad);
						
					})
				});

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