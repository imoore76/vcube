/**
 * Section table view. 
 */
Ext.define('vcube.widget.SectionTable', {
	
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.SectionTable',
    cls: 'vboxDetailsTablePanel',
    layout: {
    	type: 'table',
    	columns: 2
    },
    defaults: {
    	bodyCls: 'vboxDetailsTable'
    },
    items: [],
    
	statics : {

		/*
		 * Return section table items
		 */
		sectionTableRows: function(rows, data) {
			
			// Is rows a function?
			if(typeof(rows) == 'function') {
				rows = rows(data);
			}
			
			var tableItems = [];
			for(var i = 0; i < rows.length; i++) {
				
				// Check if row has condition
				if(rows[i].condition && !rows[i].condition(data)) continue;
				
				// hold row data
				var rowData = '';
				
				// Check for row attribute
				if(rows[i].attrib) {
					
					if(!data[rows[i].attrib]) continue;
					rowData = data[rows[i].attrib];
				
				// Check for row renderer
				} else if(rows[i].renderer) {
					rowData = rows[i].renderer(data);

				// Static data
				} else {
					rowData = rows[i].data;
				}

				
				if(rows[i].title && !rowData) {
					tableItems.push({'html':rows[i].title, 'cls': '', colspan: 2, 'width': '100%'});
				} else {
					
					tableItems.push({'html':rows[i].title + (rows[i].title ? ':' : ''), 'cls': 'vboxDetailsTableHeader'+ (rows[i].indented ? ' vboxDetailsIndented' : '')});
					tableItems.push({'html':rowData, 'cls': 'vboxDetailsTableData', 'width': '100%'});
				}
				
				
			}
			return tableItems;

		}

	},

	constructor: function(options) {
		
		Ext.Object.merge(this, {
		    title: options.sectionCfg.title,
		    icon: 'images/vbox/' + options.sectionCfg.icon,
		    cls: 'vboxDetailsTablePanel',
		    itemId : options.name,
		    items: vcube.widget.SectionTable.sectionTableRows(options.sectionCfg.rows, options.data)
		}, (options.sectionCfg.tableCfg ? options.sectionCfg.tableCfg : {}))
		
		this.callParent();
	}
	
});
