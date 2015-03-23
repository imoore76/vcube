Ext.define('vcube.form.field.bootorder', {
	extend: 'Ext.form.FieldContainer',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.bootorderfield',
    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
    
    defaults: {},
    
	layout: 'hbox',
	border: false,
	bodyStyle: { background: 'transparent' },

    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	var vals = [];
    	this.grid.getStore().each(function(record, index) {
    		if(record.get('enabled')) vals.push(record.get('id'));
    	});
    	return vals.join(',');

    },
    
    setValue: function(val) {
    	
    	if(val) {
    		
    		this.grid.getStore().sort({
    			sorterFn: function(r1,r2) {
	    			var p1 = val.indexOf(r1.get('id'));
	    			var p2 = val.indexOf(r2.get('id'));
	    			if(p1 == p2) return 0;
	    			
	    			if(p1 == -1) return 1;
	    			if(p2 == -1) return -1;
	    			return (p1 < p2 ? -1 : 1);
    			}
    		});   
    		
    	}
    	
    	if(!val) val = '';
    	
    	this.grid.getStore().each(function(record) {
    		record.set('enabled', (val.indexOf(record.get('id')) > -1));
    	});
    	
    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.grid = Ext.create('Ext.grid.Panel', {
    		height: this.height || 104,
            width: 130,
			hideHeaders: true,
			viewConfig: {
				markDirty: false
			},
			// Selection change
			listeners: {
				
				selectionchange: function(sm, selected) {
					
					if(!selected.length) return;

					var btnUp = this.grid.ownerCt.down('#btnMoveUp');
					var btnDown = this.grid.ownerCt.down('#btnMoveDown');
					
					switch(this.grid.getStore().indexOf(selected[0])) {
						case 0:
							btnUp.disable();
							btnDown.enable();
							break;
						case 3:
							btnUp.enable();
							btnDown.disable();
							break;
						default:
							btnUp.enable();
							btnDown.enable();
					}
				},
				scope: this
			},
			store: Ext.create('Ext.data.Store',{
				fields: [
				         {name: 'id', type: 'string'},
				         {name:'enabled',type:'boolean',defaultvalue:false},
				         {name:'text',type:'string'}
				         ],
				data: [{
					id: 'HardDisk',
					text: vcube.utils.vboxDevice('HardDisk')
				},{
					id: 'Network',
					text: vcube.utils.vboxDevice('Network')
				},{
					id: 'Floppy',
					text: vcube.utils.vboxDevice('Floppy')
				},{
					id: 'DVD',
					text: vcube.utils.vboxDevice('DVD')
				}]
			}),
			columns: [{
				dataIndex: 'enabled',
				xtype: 'checkcolumn',
				submitValue: false,
				width: 20
			},{
				dataIndex: 'text',
				flex: 1,
				renderer: function(val, x, record) {
					var icon = '';
					switch(record.get('id')) {
						case 'HardDisk': icon = 'hd'; break;
						case 'DVD': icon = 'cd'; break;
						case 'Floppy': icon = 'fd'; break;
						case 'Network': icon = 'nw'; break;
					}
					return '<div style="width: 16px; height: 16px; padding-left: 20px; display: inline-block; background: url(../images/vbox/'+icon+'_16px.png) no-repeat">' + val + '</div>';
				}
			}]

    	});
    	
    	this.items = [
    		   this.grid,
    		   {
    			   layout: 'vbox',
    			   margin: '2 0 0 4',
    			   border: false,
    			   bodyStyle: { background: 'transparent' },
    			   flex: 1,
    			   defaults: {
    				   xtype: 'button',
    				   height: 16,
    				   width: 16,
    				   padding: 0,
    				   border: false,
    				   frame: false,
    				   style: { background: 'transparent' },
    				   disabled: true,
    				   bodyStyle: {
    					   background: 'transparent'
    				   }
    			   },
    			   items:[{
    				   icon: 'images/vbox/list_moveup_16px.png',
    				   itemId: 'btnMoveUp',
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
    				   icon: 'images/vbox/list_movedown_16px.png',
    				   itemId: 'btnMoveDown',
    				   margin: '2 0 0 0',
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

    			   }]
    		   }
    		];
    	
	    
	    this.callParent(arguments);

    }
});