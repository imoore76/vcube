Ext.define('vcube.widget.fsbrowser',{
	
	extend: 'Ext.window.Window',
	alias: 'widget.fsbrowser',
	
	browserType: 'cd',
	
	layout: 'fit',
    width:400,
    height: 480,
    closable: true,
    modal: true,
    resizable: true,
    plain: true,
    border: false,
    
    initialPathTests: null,
    
    buttonAlign: 'center',

	
	cdFileTypes : {
		text: 'All virtual optical disk files (*.dmg,*.iso,*.cdr)',
		exts : ['dmg','iso','cdr']
	},
	
	hdFileTypes : {
		text: 'All virtual hard drive files (*.vmdk,*.vdi,*.vhd,*.hdd,*.qed,*.qcow,*.qcow2,*.vhdx)',
		exts: ['vmdk','vdi','vhd','hdd','qed','qcow','qcow2','vhdx']
	},
	
	fdFileTypes : {
		text: 'All virtual floppy disk files (*.img,*.ima,*.dsk,*.flp,*.vfd)',
		exts: ['img','ima','dsk','flp','vfd']
	},
	
	allFileTypes : {
		text: 'All files (*.*)',
		exts: ['*']
	},
	

	pathType: null,
	savePath: false,
	getLocalStorageProperty: function() {
		var prefix = '';
		if(this.pathType) {
			this.savePath = true;
			prefix = this.pathType;
		} else {
			prefix = this.browserType + 'RecentPath';
		}
		return prefix + '-' + this.serverId;
	},
	
	fsObjectChosen: null,
	
	initialPath: null,
	defaultPath: null,
	
	browse: function() {
		
		var self = this;
		this.initialPathTests = [];
		
		if(this.initialPath) {
			var pathCmp = '';
			Ext.each(this.initialPath.replace(/\\/g, '/').replace(/\/\//g,'/').replace(/\/$/,'').toLowerCase().split('/'), function(p) {
				pathCmp = (/^[a-z]:$/.test(p) ? p : String(pathCmp + '/' + p).replace('//','/'));
				self.initialPathTests.push(pathCmp);
			});
			
		}

		this.show();
		
		this.tree.getRootNode().expand();
		
		return this.fsObjectChosen;
	},
	
	
	initComponent: function(options) {
		
		this.fsObjectChosen = Ext.create('Ext.ux.Deferred');
		
		
		fileTypesOptions = []
		
		switch(this.browserType) {
		
			/* CD / DVD */
			case 'cd':
				this.icon = this.icon || 'images/vbox/cd_16px.png';
				this.title = this.title || 'Choose a virtual CD/DVD disk file...',
				this.savePath = true;
				fileTypesOptions.push(this.cdFileTypes); 
				break;
				
			/* Floppy */
			case 'fd':
				this.icon = this.icon || 'images/vbox/fd_16px.png';
				this.title = this.title || 'Choose a virtual floppy disk file...',
				this.savePath = true;
				fileTypesOptions.push(this.fdFileTypes);
				break;
				
			/* Disk */
			case 'hd':
				this.icon = this.icon || 'images/vbox/hd_16px.png';
				this.title = this.title || 'Choose a virtual hard disk file...',
				this.savePath = true;
				fileTypesOptions.push(this.hdFileTypes);
				break;
				
			/* Folders */
			case 'folder':
				this.icon = this.icon || 'images/folder_open.png';
				break;
				
		}
		
		this.initialPath = this.initialPath || vcube.app.localConfig.get(this.getLocalStorageProperty()) || this.defaultPath;
		
		if(this.browserType != 'folder')
			fileTypesOptions.push(this.allFileTypes);
		
		this.tree = Ext.create('Ext.tree.Panel',{
			rootVisible: false,
			root: {
				expanded: false,
				leaf: false
			},
			listeners: {
				selectionchange: function(sm, selection) {
					this.down('#ok').setDisabled(!selection.length || !((this.browserType == 'folder' && !selection[0].get('leaf')) || (this.browserType != 'folder' && selection[0].get('leaf'))));
				},
				itemdblclick: function() {
					if(!this.down('#ok').disabled)
						this.down('#ok').handler.call(this, this.down('#ok'));
				},
				afteritemexpand: function( node, index, item) {
					var viewEl = this.tree.getView().getEl();
					viewEl.scroll('top',(new Ext.dom.Element(item,false)).getOffsetsTo(Ext.getDom(viewEl))[1], true);
				},
				scope: this
			},
			store: Ext.create('Ext.data.TreeStore',{
				nodeParam: 'path',
				autoLoad: false,
				fields: [
				         {name: 'leaf', type: 'boolean'},
				         {name:'expanded', type: 'boolean'},
				         'text','icon','iconCls',
				         {name: 'id', type: 'string', mapping: 'fullPath'}],
		     	proxy: {
		    		type: 'vcubeAjax',
		    		url: 'vbox/fsbrowser',
		    		extraParams: {'connector': this.serverId, 'fileTypes': this.fileTypes ? this.fileTypes : (fileTypesOptions.length ? fileTypesOptions[0].exts : null)},
		        	reader: {
		        		type: 'vcubeJsonReader'
		        	}
		    	},
		    	listeners: {
		    		
		    		load: function(store, node, records) {
		    			
		    			if(!this.initialPathTests.length) return;
		    			
		    			var self = this;
		    			
		    			Ext.each(records, function(r) {
		    				
		    				Ext.each(self.initialPathTests, function(t) {
		    					
		    					if(r.get('id').replace(/\\/g,'/').replace(/(?:.)\/$/,'').toLowerCase() == t) {
		    						
		    						if(r.get('leaf')) self.tree.getSelectionModel().select(r);
		    						else r.set('expanded', true);
		    						
		    						return false;
		    					}
		    				})
		    			});		    			
		    			
		    		},
		    		scope: this
		    	}
	
			})
		});
		
		this.items = [this.tree];

		this.buttons = [{
			text: 'OK',
			itemId: 'ok',
			disabled: true,
			handler: function(btn) {
				
				var path = this.tree.getSelectionModel().getSelection()[0].get('id');
				
				if(this.savePath) {
					vcube.app.localConfig.set(this.getLocalStorageProperty(), (this.browserType == 'folder' ? path : vcube.utils.dirname(path)));
				}
				
				this.fsObjectChosen.resolve(path);
				
				btn.up('.window').close();
			},
			scope: this
		},{
			text: 'Cancel',
			handler: function(btn) {
				this.fsObjectChosen.reject();
				btn.up('.window').close();
			},
			scope: this
		}];
		
		this.callParent(arguments);
		
	}
	
});