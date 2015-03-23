/**
 * Server Summary tab
 * 
 */

Ext.define('vcube.view.ServerConnector', {
    
	extend: 'Ext.panel.Panel',
	
	statics: {
		
		sections: {

			info: {

				tableCfg: {
					title: vcube.utils.trans('Info'),
					icon: 'images/vbox/name_16px.png',
					border: true,
					width: 400,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				rows: [{
					title: 'Operating system',
					renderer: function(data) {
						return data.operatingSystem + ' (' + data.OSVersion + ')'
					}
				},{
					title: 'VirtualBox Version',
					renderer: function(data) {
						return data.version.string
					}
				}]
			},
			

			vms: {

				tableCfg: {
					title: vcube.utils.trans('Virtual Machines'),
					icon: 'images/vbox/machine_16px.png',
					border: true,
					width: 250,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				notifyEvents: ['MachineStateChanged','MachineRegistered'],
				onEvent: function(event, recordData) {
					return Ext.Object.merge({},
							vcube.view.ServerConnector.sections.vms,
							{'rows': vcube.view.ServerConnector.sections.vms.rows(recordData)});
				},
				rows: function(data) {
					
					var rows = [], states = {},
						vmList = [];
					
					vcube.storemanager.getStore('vm').each(function(record){
						if(record.get('connector_id') == data.id) vmList.push(record.getData());
					});
					
					Ext.each(vmList, function(vm) {
						if(!states[vm.state]) states[vm.state] = 1;
						else states[vm.state]++;
					});
					
					for(var state in states) {
						if(typeof(state) != 'string') continue;
						rows.push({
							title: '',
							data: states[state] + ' ' + vcube.utils.vboxVMStates.convert(state)
						});
					}
					if(rows.length == 0) {
						rows = [{
							title: '',
							data: '0 Virtual Machines'
						}];
					}
					return rows;
				}
			},
			
			
			resources: {
				tableCfg: {
					title: vcube.utils.trans('Limits'),
					icon: 'images/vbox/chipset_16px.png',
					border: true,
					width: 200,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				rows: [{
					title: 'Max Guest Ram',
					renderer: function(data) {
						return vcube.utils.mbytesConvert(data.maxGuestRAM);
					}
				},{
					title: 'Max Guest CPU Count',
					attrib: 'maxGuestCPUCount'
				}]
				
			},

			paths: {
				tableCfg: {
					title: vcube.utils.trans('Paths'),
					icon: 'images/vbox/sf_16px.png',
					border: true,
					width: 600,
					bodyStyle: { background: '#fff' },
					style: { margin: '0 20px 20px 0', display: 'inline-block', float: 'left' }
				},
				rows: [{
					title: 'Home folder',
					attrib: 'homeFolder'
				},{
					title: 'Settings File',
					attrib: 'settingsFilePath'
				},{
					title: 'Default machine folder',
					attrib: 'defaultMachineFolder'
				}]
				
			}
		}
	},
    
	alias: 'widget.ServerConnector',
	
    title: 'Connector',
    icon: 'images/vbox/virtualbox-vdi.png',
    iconCls: 'icon16',
    items: [{
    	autoScroll: true,
    	border: false,
    	defaults: { border: false },
    	items: [{
    		layout: 'hbox',
    		defaults: { border: false },
    		items: [{
    			layout: {
    				type: 'vbox',
    				align: 'stretch'
    			},
    			defaults: { border: false },
    			items: [{
    				html: '<img src="images/vbox/OSE/VirtualBox_cube_42px.png" height=64 width=64 />' 
    			},{
					xtype: 'button',
					text: 'Edit',
					border: true,
					margin: '4 0 10 0 ',
					itemId: 'editConnector' 					
    			}]
    		},{
    			
    			itemId: 'infopane',
    			flex: 1,
    			margin: '0 0 10 10',
    			tpl: '<div><h3 align="left" style="display: inline-block">'+
	    			'{[Ext.String.htmlEncode(values.name)]} @ {location} - ({[vcube.app.constants.CONNECTOR_STATES_TEXT[values.state]]})'+
	    			'</h3>'+
	    			'<tpl if="state_text.length"> - {state_text}</tpl>'+
	    			'</div><div>{[Ext.util.Format.nl2br(Ext.String.htmlEncode(values.description))]}</div>'
    		}]
    	},{
    		itemId: 'sectionspane'
    	}]
    }]
});

/**
 * Add / Edit connector dialog
 */
Ext.define('vcube.view.ServerConnector.AddEdit', {
	
    extend: 'Ext.window.Window',

    title: 'Add Connector',
    
    icon: 'images/vbox/virtualbox-vdi.png',

    width:560,
    height: 260,
    
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    closeAction: 'destroy',
    layout: 'fit',

    initComponent: function() {
    	
    	this.items = [{
    		xtype: 'form',
    		itemId: 'form',
    		frame:true,
    		defaultType:'textfield',
    		monitorValid:true,
    		buttonAlign:'center',
    		layout: 'form',
    		defaults: {
    			labelAlign: 'right'
    		},
    		items: [{
    			xtype: 'hidden',
    			name: 'id'
    		},{
    			fieldLabel: 'Name',
    			name: 'name',
    			width: 500,
    			allowBlank: false
    		},{
    			fieldLabel: 'Location',
    			name: 'location',
    			width: 500,
    			allowBlank: false,
    			validator: function(location) {
    				var re = new RegExp("^vbox://[0-9\.a-zA-Z]+:[0-9]+$");
    				if(re.test(location)) return true;
    				return 'Location must be in the form of vbox://hostname.or.ip.address:port';
    			},
    			plugins: [{
    				ptype: 'fieldhelptext',
    				text: 'Location must be in the form of vbox://hostname.or.ip.address:port'
    			}]
    		},{
    			xtype: 'textareafield',
    			fieldLabel: 'Description',
    			name: 'description',
    			anchor: '100%'
    		},{
    			xtype: 'combobox',
    			fieldLabel: 'State',
    			name: 'state',
    			queryMode: 'local',
    			displayField: 'name',
    			valueField: 'value',
    			width: 300,
    			editable: false,
    			store: Ext.create('Ext.data.Store',{
            		fields: ['name','value'],
            		data: [{
            			name: "Disabled", value: vcube.app.constants.CONNECTOR_STATES['DISABLED']
            		},{
            			name: "Enabled", value: vcube.app.constants.CONNECTOR_STATES['DISCONNECTED']
            		}]
    			})
    		}]
    	}];
    		
		this.buttons = [{ 
			text: vcube.utils.trans('Save'),
			itemId: 'save',
			disabled: true
		},{
			text: vcube.utils.trans('Cancel'),
			listeners: {
				click: function(btn) {
					btn.up('.window').close();
				}
			}
		}]
    	
    	this.callParent();
    },
});
