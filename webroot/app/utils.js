/**
 * Utilities used by vcube
 */
Ext.define('vcube.utils', {
	
	singleton: true,
	
	/**
	 * Format string as int
	 */
	toInt: function(istr) {
	
		return parseInt(istr.toString().replace(/[^0-9]/g, '')) || 0;
	},
	
	/**
	 * Format string as float
	 */
	toFloat: function(istr) {
		var base = istr.toString().split('.',2);
		var float = vcube.utils.toInt(base[0]) + '.' + ( base[1] ? vcube.utils.toInt(base[1]) : '00');
		return float + Ext.String.repeat('0', 2- float.split('.')[1].length);
	},
	
	/**
	 * Return base name of path
	 */
	 basename: function(p) {
		p = String(p);
		var DSEP = '/';
		if(p.indexOf('\\') > -1) DSEP = '\\'; 
		var pos = p.lastIndexOf(DSEP); //TODO $('#vboxPane').data('vboxConfig').DSEP);
		if(pos > -1) {
			return p.substring((pos+1));
		}
		return p;
	 },
	 
	 /**
	  * Strip file name from path
	  * @param {String} p - path
	  * @return {String} path minus file name
	  */
	 dirname: function(p) {
		 
		p = String(p);
		var DSEP = '/';
		if(p.indexOf('\\') > -1) DSEP = '\\'; 
	 	var pos = p.lastIndexOf(DSEP);
	 	if(pos > -1) {
	 		return p.substring(0,pos);
	 	}
	 	return p;
	 },

	/**
	 * Convert action item configuration to menu item
	 */
	actionToMenuItemConfig: function(actionType, item) {
		return vcube.utils.actionToButtonConfig(actionType, item, false, true);
	},
	
	/**
	 * Convert action item to button
	 */
	actionToButtonConfig: function(actionType, item, labelAsTip, keepDots) {

		var text = vcube.view.actions[actionType][item].label;
		if(!keepDots) text = text.replace('...','');
		
		var cfg = {
			icon: 'images/vbox/'+ vcube.view.actions[actionType][item].icon + '_16px.png',
			itemId: 'action-'+actionType+'-'+item
		};
		
		if(labelAsTip) {
			cfg.tooltip = text;
		} else {
			cfg.text = text;
		}
		
		return cfg;

	},

	/**
	 * Determine if this is the only VM selected
	 */
	isThisVMSelected: function(vmid, selectionModel) {
		return (vmid && selectionModel.selected.length == 1 && selectionModel.getSelection()[0].get('id') == vmid);
	},
	
	/* Return ajax parameters that specify a VM */
	vmAjaxParams: function(vm) {
		return (Ext.isString(vm) ? {
			'vm': vm,
			'connector': vcube.storemanager.getStoreRecord('vm',vm).get('connector_id')
		} : {
			'vm': vm.id,
			'connector': vm.connector_id
		});
	},
	
	/* Return selected VMs' data */
	getSelectedVMsData: function(selectionModel) {
		
		var vmList = [];
		Ext.each(selectionModel.getSelection(), function(record) {
			try {
				vmList.push(vcube.storemanager.getStoreRecordData('vm',record.get('id')));
			} catch (err) {
				// Nothing
			}
		});
		return vmList;
	},
	
	/**
	 * Perform function on each selected VM
	 */
	eachSelectedVM: function(selectionModel, fn) {
		
		Ext.each(vcube.utils.getSelectedVMsData(selectionModel), fn);
	},
	
	/**
	 * Get selected VM names in states
	 */
	getSelectedVMsInStates: function(selectionModel, states, field) {
		
		var vmList = [];
		vcube.utils.eachSelectedVM(selectionModel, function(vm) {
			if(vcube.utils.vboxVMStates.is(states, vm)) vmList.push((field ? vm[field] : vm));
		});
		return vmList;
		
	},
	
	/**
	 * Send ajax request
	 */
    ajaxRequest: function(ajaxURL, addparams, options) {
    	
    	// Halt if fatal error has occurred
    	if(vcube.app.died) return;
    	
    	// Hold ref to this object
    	var self = this;
    	
    	// Parse options
    	options = options|{};
    	var watchTask = options.watchTask|false;
    	
    	// Add function to params
    	if(!addparams) addparams = {};
    	
    	// Deferred object will be returned
    	var promise = Ext.create('Ext.ux.Deferred');
    	
    	Ext.Ajax.request({
    		
    		url: ajaxURL,
    		method: 'POST',
    		params: {},
    		jsonData: addparams,
    		
    		success: function(response) {
    			
    			var data = Ext.JSON.decode(response.responseText).data;

    			// parse meta data
    			vcube.utils.handleResponseMetaData(data);
    			
    			
    			// Resolve or reject
    			if(data && data.success && data.responseData !== null) {
    				
    				// Check for a progress operation initiated by this client
    				if(data.responseData.progress && data.responseData.task_id && watchTask) {
    					
    					promise.resolve(vcube.app.watchTask(data.responseData.progress));
    					return;
    					
    				}
    				
    				promise.resolve(data.responseData);
    				
    			} else {
    				promise.reject('ajax data was invalid or indicated a failure');
    			}
    		},
    		failure: function(response, opts) {
    		   vcube.utils.alert("Request failed: with status code " + response.status);
    		   promise.reject('ajax request failed');
		   }
    	});
    	
    	return promise;
    },

	/**
	 * Trim messages and errors out of ajax response.
	 * Alert on errors and send console messages for messages
	 */
	handleResponseMetaData : function(data) {
		
		// Append debug output to console
		if(data && data.messages && window.console && window.console.log) {
			for(var i = 0; i < data.messages.length; i++) {
				window.console.log(data.messages[i]);
			}
		}

		// Errors
		if(data.errors && data.errors.length) {
			
			for(var i = 0; i < data.errors.length; i++) {
				vcube.utils.alert(data.errors[i],{'width':'400px'});
			}
		
		}
	},
	
	/**
	 * Confirmation dialog
	 */
	confirm: function(msg, buttons, cancelText) {
		
		
    	if(!cancelText) {
    		cancelText = vcube.utils.trans('Cancel');
    	}
    	buttons.push({
    		text: cancelText,
    		listeners: {
    			click: function(btn) { btn.up('.window').close(); }
    		}
    	});
    	
    	new Ext.window.MessageBox({
    		resizable : true,
    		'buttons': buttons,
    		buttonAlign: 'center',
    	}).show({
    		title: "<div class='msgBoxTitle'>"+vcube.app.name+"</div>",
    		msg: msg,
    		icon: Ext.MessageBox.QUESTION,
    		modal: true,
    		closeAction: 'destroy'
    	});

	},
	
    /**
     * Alert dialog
     */
    alert: function(msg, dialogStyle) {
    	
    	
    	if( typeof(msg) == 'object' && msg['error'])
    		msg = msg.error + "<div class='alertDetails'>Details:<br /><textarea class='alertDetails'>" + Ext.String.htmlEncode(msg.details) + "</textarea></div>";
    		
    	
    	new Ext.window.MessageBox({resizable:true}).show({
    		title: "<div class='msgBoxTitle'>"+vcube.app.name+"</div>",
    		msg: msg,
    		icon: Ext.MessageBox.ERROR,
    		modal: true,
    		buttonText: {ok:vcube.utils.trans('OK')},
    		closeAction: 'destroy'
    	})
    	
    },

	
	/**
	 * Convert megabytes to human readable string
	 * @param {Integer} mb - megabytes
	 * @return {String} human readable size representation (e.g. 2 GB, 500 MB, etc..)
	 */
	mbytesConvert : function(mb) {
		return vcube.utils.bytesConvert(parseFloat(mb) * 1024 * 1024);
	},
	
	/**
	 * Convert bytes to human readable string
	 * @param {Integer} bytes - bytes
	 * @return {String} human readable size representation (e.g. 2 GB, 500 MB, etc..)
	 */
	bytesConvert : function(bytes) {
		var ext = new Array('B','KB','MB','GB','TB');
		var unitCount;
		for(unitCount=0; bytes >= 1024 && unitCount < ext.length; unitCount++) bytes = parseFloat(parseFloat(bytes)/1024);
		
		return Math.round(parseFloat(bytes)*Math.pow(10,2))/Math.pow(10,2) + " " + vcube.utils.trans(ext[unitCount], 'VBoxGlobal');
	},
	/**
	 * Parse str param into megabytes
	 * @param {String} str - size string (2 TB, 500 MB, etc..) to parse
	 * @return {Integer} megabytes
	 */
	convertMBString: function(str) {
		str = str.toString().replace('  ',' ');
		str = str.split(' ',2);
		if(!str[1]) str[1] = vcube.utils.trans('MB','VBoxGlobal');
		var ext = new Array(vcube.utils.trans('B','VBoxGlobal'),vcube.utils.trans('KB','VBoxGlobal'),vcube.utils.trans('MB','VBoxGlobal'),vcube.utils.trans('GB','VBoxGlobal'),vcube.utils.trans('TB','VBoxGlobal'));
		var index = Ext.Array.indexOf(ext,str[1]);
		if(index == -1) index = 2;
		switch(index) {
			case 0:
				return ((str[0] / 1024) / 1024);
				break;
			case 1:
				return (str[0] / 1024);
				break;
			case 3:
				return (str[0] * 1024);
				break;
			case 4:
				return (str[0] * 1024 * 1024);
				break;
			default:
				return (str[0]); 
		}
		
	},



	/**
	 * Common Media functions object
	 * 
	 * @namespace vboxMedia
	 */
	vboxMedia : {

		/**
		 * Return a printable string for medium m
		 * 
		 * @static
		 */
		mediumPrint : function(m,nosize,usehtml) {
			var name = vcube.utils.vboxMedia.getName(m);
			if(nosize || !m || m.hostDrive) return name;
			return name + ' (' + (m.deviceType == 'HardDisk' ? vcube.utils.trans(m.type,'VBoxGlobal') + ', ' : '') + vcube.utils.mbytesConvert(m.logicalSize) + ')';
		},

		/**
		 * Return printable medium name
		 * 
		 * @static
		 */
		getName : function(m) {
			if(!m) return vcube.utils.trans('Empty','VBoxGlobal');
			if(m.hostDrive) {
				if (m.description && m.name) {
					return vcube.utils.trans('Host Drive %1 (%2)','VBoxGlobal').replace('%1',m.description).replace('%2',m.name);
				} else if (m.location) {
					return vcube.utils.trans('Host Drive \'%1\'','VBoxGlobal').replace('%1',m.location);
				} else {
					return vcube.utils.trans('Host Drive','VBoxGlobal');
				}
			}
			return m.name;
		},

		/**
		 * Return printable medium type
		 * 
		 * @static
		 */
		getType : function(m) {
			if(!m || !m.type) return vcube.utils.trans('Normal','VBoxGlobal');
			if(m.type == 'Normal' && m.base && m.base != m.id) return vcube.utils.trans('Differencing','VBoxGlobal');
			return vcube.utils.trans(m.type,'VBoxGlobal');
		},
		
		/**
		 * Return printable medium format
		 * 
		 * @static
		 */
		getFormat : function (m) {
			if(!m) return '';
			switch(m.format.toLowerCase()) {
				case 'vdi':
					return vcube.utils.trans('VDI (VirtualBox Disk Image)','UIWizardNewVD');
				case 'vmdk':
					return vcube.utils.trans('VMDK (Virtual Machine Disk)','UIWizardNewVD');
				case 'vhd':
					return vcube.utils.trans('VHD (Virtual Hard Disk)','UIWizardNewVD');
				case 'parallels':
				case 'hdd':
					return vcube.utils.trans('HDD (Parallels Hard Disk)','UIWizardNewVD');
				case 'qed':
					return vcube.utils.trans('QED (QEMU enhanced disk)','UIWizardNewVD');
				case 'qcow':
					return vcube.utils.trans('QCOW (QEMU Copy-On-Write)','UIWizardNewVD');
			}	
			return m.format;
		},
		
		/**
		 * Return printable virtual hard disk variant
		 * 
		 * @static
		 */
		getHardDiskVariant : function(variant) {
			
			var variants = {
				Standard: 0,
				VmdkSplit2G : 1,
				VmdkRawDisk : 2,
				VmdkStreamOptimized : 4,
				VmdkESX : 8,
				Fixed : 65536,
				Diff : 131072,
				NoCreateDir : 1073741824
			} ;
			
			
	/*
	 * [Standard] => 0 [VmdkSplit2G] => 1 [VmdkRawDisk] => 2 [VmdkStreamOptimized] =>
	 * 4 [VmdkESX] => 8 [Fixed] => 65536 [Diff] => 131072 [NoCreateDir] =>
	 * 1073741824
	 */
			
			switch(variant) {

				case variants.Standard:
		            return vcube.utils.trans("Dynamically allocated storage", "VBoxGlobal");
		        case (variants.Standard | variants.Diff):
		            return vcube.utils.trans("Dynamically allocated differencing storage", "VBoxGlobal");
		        case (variants.Standard | variants.Fixed):
		            return vcube.utils.trans("Fixed size storage", "VBoxGlobal");
		        case (variants.Standard | variants.VmdkSplit2G):
		            return vcube.utils.trans("Dynamically allocated storage split into files of less than 2GB", "VBoxGlobal");
		        case (variants.Standard | variants.VmdkSplit2G | variants.Diff):
		            return vcube.utils.trans("Dynamically allocated differencing storage split into files of less than 2GB", "VBoxGlobal");
		        case (variants.Standard | variants.Fixed | variants.VmdkSplit2G):
		            return vcube.utils.trans("Fixed size storage split into files of less than 2GB", "VBoxGlobal");
		        case (variants.Standard | variants.VmdkStreamOptimized):
		            return vcube.utils.trans("Dynamically allocated compressed storage", "VBoxGlobal");
		        case (variants.Standard | variants.VmdkStreamOptimized | variants.Diff):
		            return vcube.utils.trans("Dynamically allocated differencing compressed storage", "VBoxGlobal");
		        case (variants.Standard | variants.Fixed | variants.VmdkESX):
		            return vcube.utils.trans("Fixed size ESX storage", "VBoxGlobal");
		        case (variants.Standard | variants.Fixed | variants.VmdkRawDisk):
		            return vcube.utils.trans("Fixed size storage on raw disk", "VBoxGlobal");
		        default:
		        	return vcube.utils.trans("Dynamically allocated storage", "VBoxGlobal");
		    }

		},

		/**
		 * Return media and drives available for attachment type
		 * 
		 * @static
		 */
		mediaForAttachmentType : function(t,children) {
		
			var media = new Array();
			
			// DVD Drives
			if(t == 'DVD') { media = media.concat($('#vboxPane').data('vboxHostDetails').DVDDrives);
			// Floppy Drives
			} else if(t == 'Floppy') { 
				media = media.concat($('#vboxPane').data('vboxHostDetails').floppyDrives);
			}
			
			// media
			return media.concat(vboxTraverse($('#vboxPane').data('vboxMedia'),'deviceType',t,true,(children ? 'children' : '')));
		},

		/**
		 * Return a medium by its location
		 * 
		 * @static
		 */
		getMediumByLocation : function(p) {
			// Fix this in windows version
			if($('#vboxPane').data('vboxConfig').DSEP == '\\')
				p = p.replace('\\.','/.');
			return vboxTraverse($('#vboxPane').data('vboxMedia'),'location',p,false,'children');
		},

		/**
		 * Return a medium by its name, ignoring case and 
		 * extension
		 * 
		 * @static
		 */
		getMediumByName : function(n) {
			var meds = $('#vboxPane').data('vboxMedia');
			for(var i = 0; i < meds.length; i++) {
				if(n.toLowerCase() == meds[i].name.replace(/\.[^\.]+$/, "").toLowerCase())
					return meds[i];
			}
			return null;
		},
		
		/**
		 * Elect a new hard disk name
		 */
		electHardDiskName : function(rootName, start) {
			
			/* Go through list of media and pick new hd name */
			var number = (start ? start : 1);
			var HDname = (rootName ? rootName : 'NewVirtualDisk');
			var RetName = '';
			var found = false;
			do {
				RetName = HDname + (number++);
				found = vcube.utils.vboxMedia.getMediumByName(RetName);		
			} while(found);
			
			return RetName;
		},

		/**
		 * Return a medium by its ID
		 * 
		 * @static
		 */
		getMediumById : function(id) {
			return vboxTraverse($('#vboxPane').data('vboxMedia').concat($('#vboxPane').data('vboxHostDetails').DVDDrives.concat($('#vboxPane').data('vboxHostDetails').floppyDrives)),'id',id,false,'children');
		},

		/**
		 * Return a printable list of machines and snapshots this a medium is
		 * attached to
		 * 
		 * @static
		 */
		attachedTo: function(m,nullOnNone) {
			var s = new Array();
			if(!m.attachedTo || !m.attachedTo.length) return (nullOnNone ? null : '<i>'+vcube.utils.trans('Not Attached')+'</i>');
			for(var i = 0; i < m.attachedTo.length; i++) {
				s[s.length] = m.attachedTo[i].machine + (m.attachedTo[i].snapshots.length ? ' (' + m.attachedTo[i].snapshots.join(', ') + ')' : '');
			}
			return s.join(', ');
		},

		/**
		 * Update recent media menu and global recent media list
		 * 
		 * @static
		 */
		updateRecent : function(m, skipPathAdd) {
			
			// Only valid media that is not a host drive or iSCSI
			if(!m || !m.location || m.hostDrive || m.format == 'iSCSI') return false;
			
		    // Update recent path
			if(!skipPathAdd) {
				vboxAjaxRequest('vboxRecentMediaPathSave',{'type':m.deviceType,'folder':vboxDirname(m.location)});
				$('#vboxPane').data('vboxRecentMediaPaths')[m.deviceType] = vboxDirname(m.location);
			}
			
			// Update recent media
			// ///////////////////////
			
			// find position (if any) in current list
			var pos = jQuery.inArray(m.location,$('#vboxPane').data('vboxRecentMedia')[m.deviceType]);		
			
			// Medium is already at first position, return
			if(pos == 0) return false;
			
			// Exists and not in position 0, remove from list
			if(pos > 0) {
				$('#vboxPane').data('vboxRecentMedia')[m.deviceType].splice(pos,1);
			}
			
			// Add to list
			$('#vboxPane').data('vboxRecentMedia')[m.deviceType].splice(0,0,m.location);
			
			// Pop() until list only contains 5 items
			while($('#vboxPane').data('vboxRecentMedia')[m.deviceType].length > 5) {
				$('#vboxPane').data('vboxRecentMedia')[m.deviceType].pop();
			}

			// Update Recent Media in background
			vboxAjaxRequest('vboxRecentMediaSave',{'type':m.deviceType,'list':$('#vboxPane').data('vboxRecentMedia')[m.deviceType]});
			
			return true;

		},
		
		/**
		 * List of actions performed on Media in phpVirtualBox
		 * 
		 * @static
		 * @namespace
		 */
		actions : {
			
			/**
			 * Choose existing medium file
			 * 
			 * @static
			 */
			choose : function(path,type,callback) {
			
				if(!path) path = $('#vboxPane').data('vboxRecentMediaPaths')[type];

				title = null;
				icon = null;
				switch(type) {
					case 'HardDisk':
						title = vcube.utils.trans('Choose a virtual hard disk file...','UIMachineSettingsStorage');
						icon = 'images/vbox/hd_16px.png';
						break;
					case 'Floppy':
						title = vcube.utils.trans('Choose a virtual floppy disk file...','UIMachineSettingsStorage');
						icon = 'images/vbox/fd_16px.png';
						break;
					case 'DVD':
						title = vcube.utils.trans('Choose a virtual CD/DVD disk file...','UIMachineSettingsStorage');
						icon = 'images/vbox/cd_16px.png';
						break;					
				}
				vboxFileBrowser(path,function(f){
					if(!f) return;
					var med = vcube.utils.vboxMedia.getMediumByLocation(f);
					if(med && med.deviceType == type) {
						callback(med);
						return;
					} else if(med) {
						return;
					}
					var ml = new vboxLoader();
					ml.add('mediumAdd',function(ret){
						var l = new vboxLoader();
						if(ret && ret.responseData.id) {
							var med = vboxMedia.getMediumById(ret.responseData.id);
							// Not registered yet. Refresh media.
							if(!med)
								l.add('vboxGetMedia',function(dret){$('#vboxPane').data('vboxMedia',dret.responseData);});
						}
						l.onLoad = function() {
							if(ret && ret.responseData.id) {
								var med = vboxMedia.getMediumById(ret.responseData.id);
								if(med && med.deviceType == type) {
									vboxMedia.updateRecent(med);
									callback(med);
									return;
								}
							}
						};
						l.run();
					},{'path':f,'type':type});
					ml.run();
				},false,title,icon);
			} // </ choose >
		
		} // </ actions >
	},
	
	
	/**
	 * Return VRDE Host
	 */
	vboxGetVRDEHost : function(vm) {
		var chost = (vm && vm.VRDEServer && vm.VRDEServer.netAddress ? vm.VRDEServer.netAddress : null);
		if(!chost) {
			// Set to host
			//chost = $('#vboxPane').data('vboxConfig').host;
			// Check for localhost / 127.0.0.1
			if(!chost || chost == 'localhost' || chost == '127.0.0.1')
				chost = location.hostname;
		}
		return chost;
	},

	/**
	 * Serial port namespace
	 * 
	 * @namespace vcube.utils.vboxSerialPorts
	 */
	vboxSerialPorts : {
		
		ports : [
	      { 'name':"COM1", 'irq':4, 'port':'0x3F8' },
	      { 'name':"COM2", 'irq':3, 'port':'0x2F8' },
	      { 'name':"COM3", 'irq':4, 'port':'0x3E8' },
	      { 'name':"COM4", 'irq':3, 'port':'0x2E8' },
		],
		
		/**
		 * Return port name based on irq and port
		 * 
		 * @param {Integer}
		 *            irq - irq number
		 * @param {String}
		 *            port - IO port
		 * @return {String} port name
		 */
		getPortName : function(irq,port) {
			for(var i = 0; i < vcube.utils.vboxSerialPorts.ports.length; i++) {
				if(vcube.utils.vboxSerialPorts.ports[i].irq == irq && vcube.utils.vboxSerialPorts.ports[i].port.toUpperCase() == port.toUpperCase())
					return vcube.utils.vboxSerialPorts.ports[i].name;
			}
			return 'User-defined';
		}
		
	},

	/**
	 * LPT port namespace
	 * 
	 * @namespace vboxParallelPorts
	 */
	vboxParallelPorts : {
		
		ports : [
	      { 'name':"LPT1", 'irq':7, 'port':'0x3BC' },
	      { 'name':"LPT2", 'irq':5, 'port':'0x378' },
	      { 'name':"LPT3", 'irq':5, 'port':'0x278' }
		],

		/**
		 * Return port name based on irq and port
		 * 
		 * @param {Integer}
		 *            irq - irq number
		 * @param {String}
		 *            port - IO port
		 * @return {String} port name
		 */	
		getPortName : function(irq,port) {
			for(var i = 0; i < vcube.utils.vboxParallelPorts.ports.length; i++) {
				if(vcube.utils.vboxParallelPorts.ports[i].irq == irq && vcube.utils.vboxParallelPorts.ports[i].port.toUpperCase() == port.toUpperCase())
					return vcube.utils.vboxParallelPorts.ports[i].name;
			}
			return 'User-defined';
		}
		
	},

	
	/**
	 * Serial port mode conversions
	 * 
	 * @param {String}
	 *            m - serial port mode
	 * @return {String} string used for translation
	 */
	vboxSerialMode : function(m) {
		switch(m) {
		case 'HostPipe': return 'Host Pipe';
		case 'HostDevice': return 'Host Device';
		case 'RawFile': return 'Raw File';
		}
		return m;
	},
	
	/**
	 * Network adapter type conversions
	 * 
	 * @param {String}
	 *            t - network adapter type
	 * @return {String} string used for translation
	 */
	vboxNetworkAdapterType : function(t) {
		switch(t) {
		case 'Am79C970A': return 'PCnet-PCI II (Am79C970A)';
		case 'Am79C973': return 'PCnet-FAST III (Am79C973)';
		case 'I82540EM': return 'Intel PRO/1000 MT Desktop (82540EM)';
		case 'I82543GC': return 'Intel PRO/1000 T Server (82543GC)';
		case 'I82545EM': return 'Intel PRO/1000 MT Server (82545EM)';
		case 'Virtio': return 'Paravirtualized Network (virtio-net)';
		}
	},
	
	/**
	 * Network promiscuous policy mode conversion
	 */
	vboxNetworkPromiscPolicy: function(t) {
		switch(t) {
			case 'AllowNetwork': return 'Allow VMs';
			case 'AllowAll': return 'Allow All';
		}
		return t
	},
	
	/**
	 * Audio controller conversions
	 * 
	 * @param {String}
	 *            c - audio controller type
	 * @return {String} string used for translation
	 */
	vboxAudioController : function(c) {
		switch(c) {
		case 'AC97': return 'ICH AC97';
		case 'SB16': return 'SoundBlaster 16';
		case 'HDA': return 'Intel HD Audio';
		}
	},
	
	/**
	 * Audio driver conversions
	 * 
	 * @param {String}
	 *            d - audio driver type
	 * @return {String} string used for translation
	 */
	vboxAudioDriver : function(d) {
		switch(d) {
		case 'OSS': return 'OSS Audio Driver';
		case 'ALSA': return 'ALSA Audio Driver';
		case 'Pulse': return 'PulseAudio';
		case 'WinMM': return 'Windows Multimedia';
		case 'DirectSound': return 'Windows DirectSound';
		case 'Null': return 'Null Audio Driver';
		case 'SolAudio': return 'Solaris Audio';
		}
		return d;
	},
	
	/**
	 * VM storage device conversions
	 * 
	 * @param {String}
	 *            d - storage device type
	 * @return {String} string used for translation
	 */
	vboxDevice : function(d) {
		switch(d) {
		case 'DVD': return 'CD/DVD-ROM';
		case 'HardDisk': return 'Hard Disk';
		}
		return d;
	},
	
	/**
	 * VM State functions namespace
	 * 
	 * @namespace vboxVMStates
	 */
	vboxVMStates : {
			
		/* Return whether or not vm is running */
		isRunning: function(vmRecord) {
			return (vmRecord && Ext.Array.contains(['Running','LiveSnapshotting','Teleporting'], vmRecord.state));
		},
		
		/* Return whether or not a vm is stuck */
		isStuck: function(vmRecord) {
			return (vmRecord && vmRecord.state == 'Stuck');
		},
		
		/* Whether or not a vm is paused */
		isPaused: function(vmRecord) {
			return (vmRecord && Ext.Array.contains(['Paused','TeleportingPausedVM'], vmRecord.state));
		},
		
		/* True if vm is powered off */
		isPoweredOff: function(vmRecord) {
			return (vmRecord && Ext.Array.contains(['PoweredOff','Saved','Teleported', 'Aborted'], vmRecord.state));
		},
		
		/* True if vm is saved */
		isSaved: function(vmRecord) {
			return (vmRecord && vmRecord.state == 'Saved');
		},
		
		/* True if vm is editable */
		isEditable: function(vmRecord) {
			return (vmRecord && vmRecord.sessionState == 'Unlocked');
		},
		
		/* True if one VM Record in list matches item */
		isOneRecord: function(states, vmlist) {
			
			if(typeof(states) == 'string') states = [states];
			
			for(var i = 0; i < vmlist.length; i++) {
				for(var a = 0; a < states.length; a++) {
					if(vcube.utils.vboxVMStates['is'+(states[a])](vcube.storemanager.getStoreRecordData('vm',vmlist[i].get('id'))))
						return true;					
				}
			}
			return false;
		},
		
		/* True if vm is in states list */
		is: function(states, vm) {
			for(var i = 0; i < states.length; i++) {
				if(vcube.utils.vboxVMStates['is'+(states[i])](vm))
					return true;
			}
			return false;
		},
		
		/* Convert Machine state to translatable state */
		convert: function(state) {
			switch(state) {
			case 'PoweredOff': return 'Powered Off';
			case 'LiveSnapshotting': return 'Live Snapshotting';
			case 'TeleportingPausedVM': return 'Teleporting Paused VM';
			case 'TeleportingIn': return 'Teleporting In';
			case 'TakingLiveSnapshot': return 'Taking Live Snapshot';
			case 'RestoringSnapshot': return 'Restoring Snapshot';
			case 'DeletingSnapshot': return 'Deleting Snapshot';
			case 'SettingUp': return 'Setting Up';
			default: return state;
			}
		}
	},
	
	/**
	 * VM storage device conversions
	 * 
	 * @param {String}
	 *            d - storage device type
	 * @return {String} string used for translation
	 */
	vboxDevice : function(d) {
		switch(d) {
		case 'DVD': return 'CD/DVD-ROM';
		case 'HardDisk': return 'Hard Disk';
		}
		return d;
	},
	
	/**
	 * Common VM storage / controller namespace
	 * 
	 * @namespace vboxStorage
	 */
	vboxStorage : {

		
			/**
			 * Storage Controller Types conversions
			 * 
			 * @param {String}
			 *            c - storage controller type
			 * @return {String} string used for translation
			 */
			getControllerType : function(c) {
				switch(c) {
					case 'LsiLogic': return 'Lsilogic';
					case 'LsiLogicSas': return 'LsiLogic SAS';
					case 'IntelAhci': return 'AHCI';
				}
				return c;
			},

			/**
			 * Return list of bus types
			 * 
			 * @memberOf vboxStorage
			 * @static
			 * @return {Array} list of all storage bus types
			 */
			getBusTypes : function() {
				var busts = [];
				for(var i in vcube.utils.vboxStorage) {
					if(typeof i == 'function') continue;
					if(!vcube.utils.vboxStorage[i].maxPortCount) continue;
					busts[busts.length] = i;
				}
				return busts;
			},
			
			/**
			 * Return a list of controller types for bus
			 */
			getControllerTypes: function(bus) {
				
				var list = [];
				Ext.each(vcube.utils.vboxStorage[bus].types, function(t) {
					list.push({value: t, name: vcube.utils.vboxStorage.getControllerType(t)})
				})
				return list;
				
			},
			
			/**
			 * Return icon for medium attachment type
			 */
			getMAIconName: function(ma) {
				switch(ma.type.toLowerCase()) {
					case 'dvd': return 'cd';
					case 'floppy': return 'fd';
				}
				return 'hd';
			},
			
			/**
			 * Return MA type text
			 */
			getMATypeText: function(matype) {
				switch(matype.toLowerCase()) {
					case 'dvd': return 'CD/DVD';
					case 'floppy': return 'Floppy';
				}
				return 'Hard Disk';
				
			},
			
			/**
			 * Return icon name for bus
			 * 
			 * @memberOf vboxStorage
			 * @param {String} bus - bus type
			 * @return {String} icon name
			 */
			getBusIconName : function(bus) {
				if(vcube.utils.vboxStorage[bus].displayInherit) bus = vcube.utils.vboxStorage[bus].displayInherit
				return bus.toLowerCase();
			},
			
			IDE : {
				maxPortCount : 2,
				limitOneInstance : true,
				maxDevicesPerPortCount : 2,
				types :['PIIX3','PIIX4','ICH6'],
				ignoreFlush : true,
				useHostIOCacheDefault: true,
				slotName : function(p,d) {
					switch(p+'-'+d) {
					case '0-0' : return (vcube.utils.trans('IDE Primary Master','VBoxGlobal'));
					case '0-1' : return (vcube.utils.trans('IDE Primary Slave','VBoxGlobal'));
					case '1-0' : return (vcube.utils.trans('IDE Secondary Master','VBoxGlobal'));
					case '1-1' : return (vcube.utils.trans('IDE Secondary Slave','VBoxGlobal'));
					}
				},
				driveTypes : ['DVD','HardDisk'],
				slots : function() { return {
					'0-0' : (vcube.utils.trans('IDE Primary Master','VBoxGlobal')),
					'0-1' : (vcube.utils.trans('IDE Primary Slave','VBoxGlobal')),
					'1-0' : (vcube.utils.trans('IDE Secondary Master','VBoxGlobal')),
					'1-1' : (vcube.utils.trans('IDE Secondary Slave','VBoxGlobal'))
				};
				}
			},
			
			SATA : {
				maxPortCount : 30,
				maxDevicesPerPortCount : 1,
				configurablePortCount: true,
				ignoreFlush : true,
				types : ['IntelAhci'],
				driveTypes : ['HardDisk','DVD'],
				slotName : function(p,d) { return vcube.utils.trans('SATA Port %1','VBoxGlobal').replace('%1',p); },
				slots : function() {
					var s = {};
					for(var i = 0; i < 30; i++) {
						s[i+'-0'] = vcube.utils.trans('SATA Port %1','VBoxGlobal').replace('%1',i);
					}
					return s;
				}
			},
			
			SCSI : {
				maxPortCount : 16,
				maxDevicesPerPortCount : 1,
				driveTypes : ['HardDisk','DVD'],
				types : ['LsiLogic','BusLogic'],
				ignoreFlush : true,
				slotName : function(p,d) { return vcube.utils.trans('SCSI Port %1','VBoxGlobal').replace('%1',p); },
				slots : function() {
					var s = {};
					for(var i = 0; i < 16; i++) {
						s[i+'-0'] = vcube.utils.trans('SCSI Port %1','VBoxGlobal').replace('%1',i);
					}
					return s;				
				}
			},
			SAS : {
				maxPortCount : 8,
				maxDevicesPerPortCount : 1,
				types : ['LsiLogicSas'],
				driveTypes : ['HardDisk','DVD'],
				slotName : function(p,d) { return vcube.utils.trans('SAS Port %1','VBoxGlobal').replace('%1',p); },
				slots : function() {
					var s = {};
					for(var i = 0; i < 8; i++) {
						s[i+'-0'] = vcube.utils.trans('SAS Port %1','VBoxGlobal').replace('%1',i);
					}
					return s;				
				},
				displayInherit : 'SATA'
			},
			
			
			Floppy : {
				maxPortCount : 1,
				limitOneInstance : true,
				useHostIOCacheDefault: true,
				maxDevicesPerPortCount : 2,
				types : ['I82078'],
				driveTypes : ['Floppy'],
				slotName : function(p,d) { return vcube.utils.trans('Floppy Device %1','VBoxGlobal').replace('%1',d); },
				slots : function() { return { '0-0':vcube.utils.trans('Floppy Device %1','VBoxGlobal').replace('%1','0'), '0-1' :vcube.utils.trans('Floppy Device %1','VBoxGlobal').replace('%1','1') }; }	
			}
			
	},
	
	/**
	 * Storage Controller Types conversions
	 * 
	 * @param {String}
	 *            c - storage controller type
	 * @return {String} string used for translation
	 */
	vboxStorageControllerType : function(c) {
		switch(c) {
		case 'LsiLogic': return 'Lsilogic';
		case 'LsiLogicSas': return 'LsiLogic SAS';
		case 'IntelAhci': return 'AHCI';
		}
		return c;
	},
	
	/**
	 * Convert network attachment type
	 */
	vboxNetworkAttachmentType: function(v) {
		switch(v) {
			case 'Null': return 'Not attached';
			case 'NAT': return 'NAT';
			case 'NATNetwork': return 'NAT Network';
			case 'Bridged': return 'Bridged Adapter';
			case 'Internal': return 'Internal Network';
			case 'HostOnly': return 'Host-only Adapter';
			case 'Generic': return 'Generic Driver';			
			case 'VDE': return 'VDE Adapter';
			
		}

	},
	
	/**
	 * Return the correct icon relative to images/vbox/ for the VM state.
	 * @param {String} state - virtual machine state
	 * @return {String} icon file name
	 */
	vboxMachineStateIcon : function(state) {
		var strIcon = "state_powered_off_16px.png";
		var strNoIcon = "state_running_16px.png";
		
		switch (state) {
			case "PoweredOff": strIcon = "state_powered_off_16px.png"; break;
			case "Saved": strIcon = "state_saved_16px.png"; break;
			case "Teleported": strIcon = strNoIcon; break;
			case "LiveSnapshotting": strIcon = "snapshot_online_16px.png"; break;
			case "Aborted": strIcon = "state_aborted_16px.png"; break;
			case "Running": strIcon = "state_running_16px.png"; break;
			case "Paused": strIcon = "state_paused_16px.png"; break;
			case "Stuck": strIcon = "state_stuck_16px.png"; break;
			case "Teleporting": strIcon = strNoIcon; break;
			case "Starting": strIcon = strNoIcon; break;
			case "Stopping": strIcon = strNoIcon; break;
			case "Saving": strIcon = "state_discarding_16px.png"; break;
			case "Restoring": strIcon = "vm_settings_16px.png"; break;
			case "TeleportingPausedVM": strIcon = strNoIcon; break;
			case "TeleportingIn": strIcon = strNoIcon; break;
			case "RestoringSnapshot": strIcon = "discard_cur_state_16px.png"; break;
			case "DeletingSnapshot": strIcon = "state_discarding_16px.png"; break;
			case "SettingUp": strIcon = strNoIcon; break;
			case "Hosting" : strIcon = "vm_settings_16px.png"; break;
			case "Inaccessible": strIcon = "state_aborted_16px.png"; break;
		}
		
		return strIcon;
		
	},
	
	trans : function(a,b,c,d,e) {
		return a;
	},
	
	/**
	 * Return the correct icon string relative to images/vbox/ for the guest OS type
	 * @param {String} osTypeId - guest OS type id
	 * @return {String} icon file name
	 */
	vboxGuestOSTypeIcon : function(osTypeId) {
		
		var strIcon = "os_other.png";
		switch (osTypeId)
		{
			case "Other":           strIcon = "os_other.png"; break;
			case "DOS":             strIcon = "os_dos.png"; break;
			case "Netware":         strIcon = "os_netware.png"; break;
			case "L4":              strIcon = "os_l4.png"; break;
			case "Windows31":       strIcon = "os_win31.png"; break;
			case "Windows95":       strIcon = "os_win95.png"; break;
			case "Windows98":       strIcon = "os_win98.png"; break;
			case "WindowsMe":       strIcon = "os_winme.png"; break;
			case "WindowsNT4":      strIcon = "os_winnt4.png"; break;
			case "Windows2000":     strIcon = "os_win2k.png"; break;
			case "WindowsXP":       strIcon = "os_winxp.png"; break;
			case "WindowsXP_64":    strIcon = "os_winxp_64.png"; break;
			case "Windows2003":     strIcon = "os_win2k3.png"; break;
			case "Windows2003_64":  strIcon = "os_win2k3_64.png"; break;
			case "WindowsVista":    strIcon = "os_winvista.png"; break;
			case "WindowsVista_64": strIcon = "os_winvista_64.png"; break;
			case "Windows2008":     strIcon = "os_win2k8.png"; break;
			case "Windows2008_64":  strIcon = "os_win2k8_64.png"; break;
			case "Windows7":        strIcon = "os_win7.png"; break;
			case "Windows7_64":     strIcon = "os_win7_64.png"; break;
			case "Windows81":
			case "Windows8":        strIcon = "os_win8.png"; break;
			case "Windows81_64":
			case "Windows8_64":     strIcon = "os_win8_64.png"; break;
			case "WindowsNT_64":
			case "WindowsNT":       strIcon = "os_win_other.png"; break;
			case "Windows2012_64":	strIcon = "os_win2k12_64.png"; break;
			case "OS2Warp3":        strIcon = "os_os2warp3.png"; break;
			case "OS2Warp4":        strIcon = "os_os2warp4.png"; break;
			case "OS2Warp45":       strIcon = "os_os2warp45.png"; break;
			case "OS2eCS":          strIcon = "os_os2ecs.png"; break;
			case "OS2":             strIcon = "os_os2_other.png"; break;
			case "Linux_64":
			case "Linux":           strIcon = "os_linux_other.png"; break;
			case "Linux22":         strIcon = "os_linux22.png"; break;
			case "Linux24":         strIcon = "os_linux24.png"; break;
			case "Linux24_64":      strIcon = "os_linux24_64.png"; break;
			case "Linux26":         strIcon = "os_linux26.png"; break;
			case "Linux26_64":      strIcon = "os_linux26_64.png"; break;
			case "ArchLinux":       strIcon = "os_archlinux.png"; break;
			case "ArchLinux_64":    strIcon = "os_archlinux_64.png"; break;
			case "Debian":          strIcon = "os_debian.png"; break;
			case "Debian_64":       strIcon = "os_debian_64.png"; break;
			case "OpenSUSE":        strIcon = "os_opensuse.png"; break;
			case "OpenSUSE_64":     strIcon = "os_opensuse_64.png"; break;
			case "Fedora":          strIcon = "os_fedora.png"; break;
			case "Fedora_64":       strIcon = "os_fedora_64.png"; break;
			case "Gentoo":          strIcon = "os_gentoo.png"; break;
			case "Gentoo_64":       strIcon = "os_gentoo_64.png"; break;
			case "Mandriva":        strIcon = "os_mandriva.png"; break;
			case "Mandriva_64":     strIcon = "os_mandriva_64.png"; break;
			case "RedHat":          strIcon = "os_redhat.png"; break;
			case "RedHat_64":       strIcon = "os_redhat_64.png"; break;
			case "Turbolinux":      strIcon = "os_turbolinux.png"; break;
			case "Turbolinux_64":      strIcon = "os_turbolinux_64.png"; break;
			case "Ubuntu":          strIcon = "os_ubuntu.png"; break;
			case "Ubuntu_64":       strIcon = "os_ubuntu_64.png"; break;
			case "Xandros":         strIcon = "os_xandros.png"; break;
			case "Xandros_64":      strIcon = "os_xandros_64.png"; break;
			case "FreeBSD":         strIcon = "os_freebsd.png"; break;
			case "FreeBSD_64":      strIcon = "os_freebsd_64.png"; break;
			case "OpenBSD":         strIcon = "os_openbsd.png"; break;
			case "OpenBSD_64":      strIcon = "os_openbsd_64.png"; break;
			case "NetBSD":          strIcon = "os_netbsd.png"; break;
			case "NetBSD_64":       strIcon = "os_netbsd_64.png"; break;
			case "Solaris":         strIcon = "os_solaris.png"; break;
			case "Solaris_64":      strIcon = "os_solaris_64.png"; break;
			case "Solaris11_64":      strIcon = "os_oraclesolaris_64.png"; break;
			case "OpenSolaris":     strIcon = "os_oraclesolaris.png"; break;
			case "OpenSolaris_64":  strIcon = "os_oraclesolaris_64.png"; break;
			case "QNX":             strIcon = "os_qnx.png"; break;
			case 'MacOS':			strIcon = "os_macosx.png"; break;
			case 'MacOS_64':			strIcon = "os_macosx_64.png"; break;
			case 'Oracle':			strIcon = "os_oracle.png"; break;
			case 'Oracle_64':			strIcon = "os_oracle_64.png"; break;
			case 'JRockitVE':		strIcon = 'os_jrockitve.png'; break;
			case "VirtualBox_Host":	strIcon = "os_virtualbox.png"; break;
			
			default:
				break;
		}
		return strIcon;
	},
	
	/**
	 * Return a time or date+time string depending on
	 * how much time has elapsed
	 * @param {Integer} t - seconds since 1/1/1970 0:0:0
	 * @param {String} replaceTime - optional string to return replacing time
	 * @param {String} replaceDateTime - optional string to return replace date_time
	 * @return {String} time or date+time string
	 */
	dateTimeString : function(t, replaceTime, replaceDateTime) {

		var sdate = new Date(t*1000);
		if((new Date().getTime() - sdate.getTime())/1000 > 86400
				|| new Date().getDate() != sdate.getDate()) {
				return (replaceDateTime ? replaceDateTime.replace('%1',sdate.toLocaleString()) : sdate.toLocaleString());
			}
		return (replaceTime ? replaceTime.replace('%1',sdate.toLocaleTimeString()) : sdate.toLocaleTimeString());
	},
	
	/**
	 * Returns the result of case-insensitive string comparison using 'natural' algorithm comparing str1 to str2
	 * @param {String} str1 - 1st string
	 * @param {String} str2 - 2nd string
	 * @return {Integer} integer for use in list sorting comparison
	 */
	strnatcasecmp : function(str1, str2) {
	    // Returns the result of case-insensitive string comparison using 'natural' algorithm  
	    // 
	    // version: 1004.2314
	    // discuss at: http://phpjs.org/functions/strnatcasecmp    // +      original by: Martin Pool
	    // + reimplemented by: Pierre-Luc Paour
	    // + reimplemented by: Kristof Coomans (SCK-CEN (Belgian Nucleair Research Centre))
	    // + reimplemented by: Brett Zamir (http://brett-zamir.me)
	    // +      bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)    // *     example 1: strnatcasecmp(10, 1);
	    // *     returns 1: 1
	    // *     example 1: strnatcasecmp('1', '10');
	    // *     returns 1: -1
	    var a = (str1+'').toLowerCase();    var b = (str2+'').toLowerCase();
	 
	    var isWhitespaceChar = function (a) {
	        return a.charCodeAt(0) <= 32;
	    }; 
	    var isDigitChar = function (a) {
	        var charCode = a.charCodeAt(0);
	        return ( charCode >= 48  && charCode <= 57 );
	    }; 
	    var compareRight = function (a,b) {
	        var bias = 0;
	        var ia = 0;
	        var ib = 0; 
	        var ca;
	        var cb;
	 
	        // The longest run of digits wins.  That aside, the greatest        // value wins, but we can't know that it will until we've scanned
	        // both numbers to know that they have the same magnitude, so we
	        // remember it in BIAS.
	        for (;; ia++, ib++) {
	            ca = a.charAt(ia);            cb = b.charAt(ib);
	 
	            if (!isDigitChar(ca) &&
	                !isDigitChar(cb)) {
	                return bias;            } else if (!isDigitChar(ca)) {
	                return -1;
	            } else if (!isDigitChar(cb)) {
	                return +1;
	            } else if (ca < cb) {                if (bias == 0) {
	                    bias = -1;
	                }
	            } else if (ca > cb) {
	                if (bias == 0) {                    bias = +1;
	                }
	            } else if (ca == 0 && cb == 0) {
	                return bias;
	            }        }
	    };
	 
	    var ia = 0, ib = 0;
	    var nza = 0, nzb = 0;    var ca, cb;
	    var result;
	 
	    while (true) {
	        // only count the number of zeroes leading the last number compared        nza = nzb = 0;
	 
	        ca = a.charAt(ia);
	        cb = b.charAt(ib);
	         // skip over leading spaces or zeros
	        while (isWhitespaceChar( ca ) || ca =='0') {
	            if (ca == '0') {
	                nza++;
	            } else {                // only count consecutive zeroes
	                nza = 0;
	            }
	 
	            ca = a.charAt(++ia);        }
	 
	        while (isWhitespaceChar( cb ) || cb == '0') {
	            if (cb == '0') {
	                nzb++;            } else {
	                // only count consecutive zeroes
	                nzb = 0;
	            }
	             cb = b.charAt(++ib);
	        }
	 
	        // process run of digits
	        if (isDigitChar(ca) && isDigitChar(cb)) {            if ((result = compareRight(a.substring(ia), b.substring(ib))) != 0) {
	                return result;
	            }
	        }
	         if (ca == 0 && cb == 0) {
	            // The strings compare the same.  Perhaps the caller
	            // will want to call strcmp to break the tie.
	            return nza - nzb;
	        } 
	        if (ca < cb) {
	            return -1;
	        } else if (ca > cb) {
	            return +1;        }
	 
	        ++ia; ++ib;
	    }
	}
	
});
