/**
 * View configuration for actions
 * 
 * $Id$
 * 
 */
Ext.define('vcube.actions.config',{
	statics: {
		actionTypes: ['machine','server','snapshots','vmgroup']		
	}
});

/**
 * Virtual Machine actions
 */
Ext.define('vcube.actions.config.machine',{
	
	statics: {
		
		actions: ['new','add','start','settings','clone','refresh','remove','discard',
		          'guestAdditionsInstall','logs','savestate','powerbutton','pause',
		          'poweroff','reset','stop'],
			
		/** Invoke the new virtual machine wizard */
		'new':{
			text: vcube.utils.trans('New...','UIActionPool'),
			icon:'vm_new'
		},
		
		/** Add a virtual machine via its settings file */
		add: {
			text: vcube.utils.trans('Add...','UIActionPool'),
			icon:'vm_add'
		},
		
		/** Start VM */
		start: {
			text: vcube.utils.trans('Start','UIActionPool'),
			icon : 'vm_start'	
		},
		
		/** Invoke VM settings dialog */
		settings: {
			text: vcube.utils.trans('Settings...','UIActionPool'),
			icon:'vm_settings',
		},
		
		/** Clone a VM */
		clone: {
			text: vcube.utils.trans('Clone...','UIActionPool'),
			icon:'vm_clone',
		},
		
		/** Refresh a VM's details */
		refresh: {
			text: vcube.utils.trans('Refresh','UIVMLogViewer'),
			icon:'refresh'
		},
		
		/** Delete / Remove a VM */
		remove: {
			text: vcube.utils.trans('Remove...', 'UIActionPool'),
			icon:'vm_delete',
			progressImage: 'progress_delete_90px.png',
			progressTitle: vcube.utils.trans('Remove the selected virtual machines', 'UIActionPool')
		},
		
		/** Discard VM State */
		discard: {
			text: vcube.utils.trans('Discard saved state...','UIActionPool'),
			icon:'vm_discard'
		},
		
		/** Install Guest Additions **/
		guestAdditionsInstall : {
			text: vcube.utils.trans('Install Guest Additions...','UIActionPool'),
			icon: 'guesttools',
			progressImage: 'progress_install_guest_additions_90px.png',
			progressTitle: vcube.utils.trans('Install Guest Additions...','UIActionPool')
		},
		
		/** Show VM Logs */
		logs: {
			text: vcube.utils.trans('Show Log...','UIActionPool'),
			icon:'vm_show_logs'
		},
		
		/** Save the current VM State */
		savestate: {
			text: vcube.utils.trans('Save State', 'UIActionPool'),
			icon: 'vm_save_state',
			progressImage: 'progress_state_save_90px.png'
		},
		
		/** Send ACPI Power Button to VM */
		powerbutton: {
			text: vcube.utils.trans('ACPI Shutdown','UIActionPool'),
			icon: 'vm_shutdown'
		},
		
		/** Pause a running VM */
		pause: {
			text: vcube.utils.trans('Pause','UIActionPool'),
			icon: 'vm_pause'
		},
		
		/** Power off a VM */
		poweroff: {
			text: vcube.utils.trans('Power Off','UIActionPool'),
			icon: 'vm_poweroff',
			progressImage: 'progress_poweroff_90px.png'
		},
		
		/** Reset a VM */
		reset: {
			text: vcube.utils.trans('Reset','UIActionPool'),
			icon: 'vm_reset'
		},
		
		/** Stop a VM */
		stop: {
			name: 'stop',
			text: vcube.utils.trans('Stop','VBoxSelectorWnd'),
			icon: 'vm_shutdown'
		}

	}

});


/**
 * Virtual Machine Group Actions
 */
Ext.define('vcube.actions.config.vmgroup',{
	
	statics : {
		actions: []
	}
	
});


/**
 * Server actions
 */
Ext.define('vcube.actions.config.server',{
	
	statics : {
		
		actions: ['newvm','addvm','vbsettings','remove','new'],

		'new': {
			text: 'New connector...',
			icon: 'virtualbox-vdi'
		},
		
		'newvm':{
			text: vcube.utils.trans('Create Virtual Machine...','UIActionPool'),
			icon:'vm_new'
		},
		
		addvm : {
			text: 'Add Virtual Machine...',
			icon: 'vm_add',
		},
		
		vbsettings: {
			text: vcube.utils.trans('VirtualBox Settings...','UIActionPool'),
			icon:'OSE/VirtualBox',
		},
		
		remove: {
			text: vcube.utils.trans('Remove...', 'UIActionPool'),
			icon:'vm_delete'
		}
	}
	
});

/**
 * Snapshot actions
 */
Ext.define('vcube.actions.config.snapshots',{
	
	statics: {
		
		actions: ['take','restore','delete','clone','show'],
		
		take: {
			text: vcube.utils.trans('Take Snapshot...','UIActionPool'),
			icon: 'snapshot_take',
			progressImage: 'progress_snapshot_create_90px.png',
			progressTitle: vcube.utils.trans('Take Snapshot...','UIActionPool'),
			
		},
		
		restore: {
			text: vcube.utils.trans('Restore Snapshot','VBoxSnapshotsWgt'),
			icon: 'snapshot_restore'		
		},
		
		'delete' : {
			text: vcube.utils.trans('Delete Snapshot','VBoxSnapshotsWgt'),
			icon: 'snapshot_delete'		
		},
		
		
		clone: {
			text: vcube.utils.trans('Clone...','UIActionPool'),
			icon: 'vm_clone'
		},
		
		show: {
			text: vcube.utils.trans('Show Details','VBoxSnapshotsWgt'),
			icon: 'snapshot_show_details'    	
		}
		
	}
	
				
	
});

/**
 * Media actions
 */

Ext.define('vcube.actions.config.media',{
	
	statics : {
		actions: []
	}


});
