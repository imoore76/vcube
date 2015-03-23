/*
 * List of virtual machines in server or group
 */
Ext.define('vcube.view.VirtualMachinesList', {
	extend: 'Ext.panel.Panel',
    alias: 'widget.VirtualMachinesList',
    title: 'Virtual Machines',
    icon: 'images/vbox/machine_16px.png',
    frame: true,
    defaults: { viewConfig: { markDirty: false } },

    initComponent: function(config) {
    	
    	this.items = [{
    		xtype: 'gridpanel',
    		selModel: { mode: 'MULTI' },
    		store: Ext.create('vcube.store.VirtualMachines'),
    		tbar : [
    		        vcube.actionpool.getAction('machine','new'),
    		        '-',
    		        vcube.actionpool.getAction('machine','start'),
    		        // stop
    		        Ext.Object.merge({},vcube.actionpool.getActionsAsBase('machine',['stop'])[0],{
    		        	menu: vcube.actionpool.getActions('machine',['savestate','powerbutton','poweroff'])
    		        }),
    		        '-',
    		        vcube.actionpool.getAction('machine','settings')
    		        
    		        ],
    		        columns: [{
    		        	header: 'Name',
    		        	dataIndex: 'name',
    		        	flex: 1,
    		        	renderer: function(val,m,record) {
    		        		if(record.get('icon')) {
    		        			icon = record.get('icon');
    		        		} else {
    		        			icon = 'images/vbox/'+vcube.utils.vboxGuestOSTypeIcon(record.get('OSTypeId'));
    		        		}
    		        		
    		        		return '<img src="'+ icon + '" style="float: left; display: inline-block; height: 16px; width:16px; margin-right: 3px;" />' +
    		        		(record.get('sessionState') != 'Unlocked' ? '<i>'+val+'</i>' : val);
    		        	}
    		        },{
    		        	header: 'State',
    		        	dataIndex: 'state',
    		        	width: 150,
    		        	renderer: function(val) {
    		        		return '<div style="display: inline-block; width: 16px; height: 16px; background: '+
    		        		'url(images/vbox/'+vcube.utils.vboxMachineStateIcon(val)+') no-repeat; padding-left: 19px;">' + 
    		        		vcube.utils.vboxVMStates.convert(val) + '</div>'; 
    		        	}
    		        },{
    		        	header: 'Last State Change',
    		        	dataIndex: 'lastStateChange',
    		        	xtype: 'EpocDateColumn',
    		        	format: 'Y-m-d H:i.s',
    		        	width: 150
    		        },{
    		        	header: 'OS',
    		        	dataIndex: 'OSTypeDesc',
    		        	width: 150
    		        },{
    		        	header: 'Memory',
    		        	dataIndex: 'memorySize',
    		        	width: 100,
    		        	renderer: function(val) {
    		        		return val + ' MB';
    		        	}
    		        },{
    		        	header: 'CPUs',
    		        	dataIndex: 'CPUCount',
    		        	align: 'center',
    		        	width: 100
    		        }]    	
    	}]
    	
    	this.callParent(arguments);
    }
});

