Ext.define('vcube.grid.column',{});

/*
 * Epoc date format column.
 */
Ext.define('vcube.grid.column.EpocDateColumn', {
    extend: 'Ext.grid.column.Date',
    alias: 'widget.EpocDateColumn',
    initComponent: function() {
    	
        var me = this;
        
        me.callParent(arguments);
        if (!me.format) {
            me.format = Ext.Date.defaultFormat;
        }
        me.renderer = function(v) {
        	return Ext.util.Format.date(new Date(v*1000).toString(), me.format);
        }
    }
});



/*
 * Event severity
 */
Ext.define('vcube.grid.column.EventSeverityColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.eventseveritycolumn',
    header: 'Severity',
    dataIndex: 'severity',
	renderer: function(sev) {
		var name = 'Unknown';
		try {
			name = vcube.app.constants.SEVERITY_TEXT[sev];
		} catch(err) {
			name = 'Unknown';
		}
		return "<div class='severityColuumn severityColuumn" + sev + "'> </div>" + name;
	}
});

/*
 * Server column
 */
Ext.define('vcube.grid.column.ServerColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.servercolumn',
    header: 'Server',
	dataIndex: 'connector',
	renderer: function(val) {
		try {
			return '<span class="activeLabel-connector-'+val+'-name">'+Ext.String.htmlEncode(vcube.storemanager.getStoreRecord('server',val).get('name'))+'</span>';    					
		} catch (err) {
			return 'Unknown(' + val + ')';
		}
	},
	width: 150
});

/*
 * Task details with progress
 */
Ext.define('vcube.grid.column.TaskDetailsColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.taskdetailscolumn',
    header: 'Details',
	dataIndex: 'details',
	renderer: function(val,m,record,ri,ci,store,view) {

		// Still in progress?
		if(record.get('progress')) {
			
			m.style = "padding: 0px;";
			
			var width = view.panel.columns[ci].el.dom.scrollWidth - 2;
			
			var progress = record.get('progress');
			
			return '<div class="x-progress x-progress-default">'+
	        	'<div class="x-progress-text x-progress-text-back" style="width: ' + width + 'px;">'+
	        	progress.operationDescription +
	        '</div>'+
	        '<div class="x-progress-bar x-progress-bar-default" style="width:'+progress.percent+'%">'+
	            '<div class="x-progress-text" style="width: '+width+'px;">'+
	                '<div>'+
	                progress.operationDescription + 
	                '</div>'+
	            '</div>'+
	        '</div>'+
	    '</div>';
		}
		m.style = "";
		return Ext.String.htmlEncode(val);
	}
});

/*
 * Task status
 */
Ext.define('vcube.grid.column.TaskStatusColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.taskstatuscolumn',
    header: 'Status',
	dataIndex: 'status',
	renderer: function(val,m,record) {
		
		// Still in progress?
		if(record.raw.progress && record.raw.progress.cancelable) {
			return '<a href="#" onClick="javascript:vcube.controller.XTasksAndEvents.cancelProgress(\''+
				record.raw.progress.progress_id +'\', '+ record.raw.progress.connector_id + ')" />Cancel</a>';
		}
		var status = 'Unknown';
		try {
			status = vcube.app.constants.TASK_STATUS_TEXT[val];
		} catch(err) {
			status = 'Unknown';
		}
		return status;
	}
});


/*
 * Virtual Machine
 */
Ext.define('vcube.grid.column.MachineColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.machinecolumn',
    header: 'Machine',
	dataIndex: 'machine',
	renderer: function(vmid) {
		if(vmid) {
			try {
				return '<span class="activeLabel-vm-'+vmid+'-name">' + vcube.storemanager.getStoreRecord('vm',vmid).get('name') + '</span>';
			} catch(err) {
				return vmid;
			}
		}
	},
	width: 150
});

/*
 * Task name column
 * 
 */
Ext.define('vcube.grid.column.TaskNameColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.tasknamecolumn',
	header: 'Task',
	dataIndex: 'name',
	renderer: function(v,m,record) {
		if(record.get('machine')) {
			cls = 'eventColumnMachine';
		} else if(record.get('connector')) {
			cls = 'eventColumnServer';
		} else {
			cls = 'eventColumnGeneral';
		}
		return '<div class="gridColumnIcon '+cls+'"> </div>' + Ext.String.htmlEncode(v);
	},
	width: 300
});

/*
 * Event name
 */
Ext.define('vcube.grid.column.EventNameColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.eventnamecolumn',
	header: 'Event',
	dataIndex: 'name',
	renderer: function(v,m,record) {
		if(record.get('machine')) {
			cls = 'eventColumnMachine';
		} else if(record.get('connector')) {
			cls = 'eventColumnServer';
		} else {
			cls = 'eventColumnGeneral';
		}
		return '<div class="gridColumnIcon '+cls+'"> </div>' + Ext.String.htmlEncode(v);
	},
	width: 300
});

/*
 * Log category (for task and event log)
 */
Ext.define('vcube.grid.column.LogCategoryColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.logcategorycolumn',
	header: 'Category',
	dataIndex: 'category',
	renderer: function(v,m,record) {
		var name = 'Unknown';
		try {
			name = vcube.app.constants.LOG_CATEGORY_TEXT[v];			
		} catch(err) {
			name = 'Unknown';
		}
		return "<div class='categoryColumn categoryColumnType" + v + "'> </div>" + name;
	}
});

