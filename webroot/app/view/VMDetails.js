/**
 * Virtual Machine Details tab
 * 
 */

Ext.define('vcube.view.VMDetails', {
    
	extend: 'Ext.panel.Panel',
    
	alias: 'widget.VMDetails',
	
	/* Details */
    title: 'Details',
    itemId: 'DetailsTab',
    cls: 'vmTabDetails',
    icon: 'images/vbox/vm_settings_16px.png',
    autoScroll: true,
    layout: 'vbox',
    width: '100%',
    defaults: { xtype: 'panel', width: '100%', margin: '0 10 10 10' },
    style : { background: '#f9f9f9' },
    bodyStyle : { background: '#f9f9f9' },
    itemId: 'sectionspane',
	statics: {
		
		/*
		 * 
		 * List of VM details sections and their content
		 * 
		 */
		sections : {
				
				/*
				 * General
				 */
				general: {
					icon:'machine_16px.png',
					title: vcube.utils.trans('General','VBoxGlobal'),
					settingsLink: 'General',
					multiSelectDetailsTable: true,
					rows : [
					   {
						   title: vcube.utils.trans('Name', 'VBoxGlobal'),
						   attrib: 'name'
					   },
					   {
						   title: vcube.utils.trans('OS Type', 'VBoxGlobal'),
						   attrib: 'OSTypeDesc'
					   },
					   {
						   title: vcube.utils.trans('Guest Additions Version'),
						   attrib: 'guestAdditionsVersion'
					   }
					   
					]
				},
				
				/*
				 * System
				 */
				system : {
					icon:'chipset_16px.png',
					title: vcube.utils.trans('System','VBoxGlobal'),
					settingsLink: 'System',
					redrawOnEvents: ['CPUExecutionCapChanged'],
					multiSelectDetailsTable: true,
					rows : [
					   {
						   title: vcube.utils.trans('Base Memory','VBoxGlobal'),
						   renderer: function(d) {
							   return vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',d['memorySize']);
						   }
					   },{
						   title: vcube.utils.trans("Processor(s)",'VBoxGlobal'),
						   attrib: 'CPUCount',
						   condition: function(d) { return d.CPUCount > 1; }
					   },{
						   title: vcube.utils.trans("Execution Cap"),
						   renderer: function(d) {
							   return vcube.utils.trans('<nobr>%1%</nobr>').replace('%1',parseInt(d['CPUExecutionCap']));
						   },
						   condition: function(d) { return d.CPUExecutionCap < 100; }
					   },{
						   title: vcube.utils.trans("Boot Order"),
						   renderer: function(d) {
								var bo = new Array();
								var mbo = d.bootOrder.split(',');
								for(var i = 0; i < mbo.length; i++) {
									bo[i] = vcube.utils.trans(vcube.utils.vboxDevice(mbo[i]),'VBoxGlobal');
								}
								return bo.join(', ');
						   }
					   },{
						   title: vcube.utils.trans("Acceleration",'UIGDetails'),
						   renderer: function(d) {
							   var acList = [];
							   if(d['HWVirtExProperties'].Enabled) acList[acList.length] = vcube.utils.trans('VT-x/AMD-V');
							   if(d['HWVirtExProperties'].NestedPaging) acList[acList.length] = vcube.utils.trans('Nested Paging');
							   if(d['CpuProperties']['PAE']) acList[acList.length] = vcube.utils.trans('PAE/NX');							   
							   if(d['HWVirtExProperties'].LargePages) acList[acList.length] = vcube.utils.trans('Large Pages');
							   if(d['HWVirtExProperties'].UnrestrictedExecution) acList[acList.length] = vcube.utils.trans('Enable unrestricted execution');
							   if(d['HWVirtExProperties'].VPID) acList[acList.length] = vcube.utils.trans('VT-x VPID');
							   return acList.join(', ');
						   },
					   	   condition: function(d) { return (d['HWVirtExProperties'].Enabled || d['CpuProperties']['PAE']); }
					   }
					]
				},
				
				/*
				 * Display
				 */
				display : {
					icon: 'vrdp_16px.png',
					title: vcube.utils.trans('Display'),
					settingsLink: 'Display',
					redrawOnEvents: ['VRDEServerInfoChanged','VRDEServerChanged','MachineStateChanged'],
					rows: [
					   {
						   title: vcube.utils.trans("Video Memory"),
						   renderer: function(d) {
							   return vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',d['VRAMSize']);
						   }
					   },{
						   title: vcube.utils.trans('Remote Desktop Server Port'),
						   renderer: function(d) {
							   
							   var chost = vcube.utils.vboxGetVRDEHost(d);
							
							   // Get ports
							   var rowStr = d['VRDEServer']['ports'];
							   
							   // Just this for snapshots
							   if(d._isSnapshot) return rowStr;
							   
							   // Display links?
							   if((d['state'] == 'Running' || d['state'] == 'Paused') && d['VRDEServerInfo']) {
								   
								   if(d['VRDEServerInfo']['port'] > 0 && d['VRDEServer']['VRDEExtPack'].indexOf("VNC") == -1) {
									   rowStr = " <a href='rdp.php?host=" + chost + '&port=' + d['VRDEServerInfo']['port'] + "&id=" + d['id'] + "&vm=" + encodeURIComponent(d['name']) + "'>" + d['VRDEServerInfo']['port'] + "</a>";						   
									   rowStr += ' <img src="images/vbox/blank.gif" style="vspace:0px;hspace:0px;height2px;width:10px;" /> (' + chost + ':' + d['VRDEServerInfo']['port'] + ')';
									   
								   } else if (d['VRDEServer']['VRDEExtPack'].indexOf("VNC") == -1) {
									   rowStr = '<span style="text-decoration: line-through; color: #f00;">' + rowStr + '</span>';						   
								   }
							   } else {
								   rowStr += ' ('+chost+')';
							   }
							   return rowStr;
							   
			  
						   },
						   html: true,
						   condition: function(d) {
							   
							   // Running and paused states have real-time console info
							   if(!d._isSnapshot && (d['state'] == 'Running' || d['state'] == 'Paused')) {
								   return d.VRDEServer && (d.VRDEServer.enabled);
							   }
							   return (d['VRDEServer'] && (d._isSnapshot || d['VRDEServer']['VRDEExtPack']) && d['VRDEServer']['enabled'] && d['VRDEServer']['ports']);
						   }
					   },{
						   title: vcube.utils.trans("Remote Desktop Server"),
						   renderer: function(d) {
							   return vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (VRDE Server)');
						   },
						   condition: function(d) {

							   // Running and paused states have real-time console info
							   if(!d._isSnapshot && (d['state'] == 'Running' || d['state'] == 'Paused')) {
								   return d.VRDEServer && (d.VRDEServer.enabled);
							   }
							   return (d['VRDEServer'] && (d._isSnapshot || d['VRDEServer']['VRDEExtPack']) && d['VRDEServer']['enabled'] && d['VRDEServer']['ports']);
						   }
					   }
					]
				},
				
				/*
				 * Storage controllers
				 */
				storage : {
					icon:'hd_16px.png',
					title: vcube.utils.trans('Storage'),
					settingsLink: 'Storage',
					redrawOnEvents: ['MediumChanged','MachineStateChanged'],
					rows: function(d) {
						
						var rows = new Array();
						
						for(var a = 0; a < d['storageControllers'].length; a++) {
							
							var con = d['storageControllers'][a];
							
							// Controller name
							rows.push({
								title: Ext.String.htmlEncode(vcube.utils.trans('Controller: %1','UIMachineSettingsStorage').replace('%1',con.name)),
								renderer: function(){return'';}
							});
									
							// Each attachment.
							for(var b = 0; b < d['storageControllers'][a]['mediumAttachments'].length; b++) {
								
								rows.push({
									title: vcube.utils.vboxStorage[d['storageControllers'][a].bus].slotName(d['storageControllers'][a]['mediumAttachments'][b].port, d['storageControllers'][a]['mediumAttachments'][b].device),
									indented: true,
									data: (d['storageControllers'][a]['mediumAttachments'][b].type == 'DVD' ? vcube.utils.trans('[CD/DVD]','UIGDetails') + ' ' : '') + 
										vcube.utils.vboxMedia.mediumPrint(d['storageControllers'][a]['mediumAttachments'][b].medium, false),
									html: true
								});
								
							}
							
						}
						return rows;
					}
				},
				
				/*
				 * Audio
				 */
				audio : {
					icon:'sound_16px.png',
					title: vcube.utils.trans('Audio'),
					settingsLink: 'Audio',
					rows: [
					    {
						    title: '<span class="vboxDetailsNone">'+vcube.utils.trans("Disabled",'VBoxGlobal',null,'details report (audio)')+'</span>',
						    html: true,
						    condition: function(d) { return !d['audioAdapter']['enabled']; },
						    data: ''
					    },{
					    	title: vcube.utils.trans("Host Driver",'UIDetailsBlock'),
					    	renderer: function(d) {
					    		return vcube.utils.trans(vcube.utils.vboxAudioDriver(d['audioAdapter']['audioDriver']),'VBoxGlobal');
					    	},
					    	condition: function(d) { return d['audioAdapter']['enabled']; }
					    },{
					    	title: vcube.utils.trans("Controller",'UIDetailsBlock'),
					    	renderer: function (d) {
					    		return vcube.utils.trans(vcube.utils.vboxAudioController(d['audioAdapter']['audioController']),'VBoxGlobal');
					    	},
					    	condition: function(d) { return d['audioAdapter']['enabled']; }
					    }
					]
				},
				
				/*
				 * Network adapters
				 */
				network : {
					icon: 'nw_16px.png',
					title: vcube.utils.trans('Network'),
					redrawOnEvents: ['NetworkAdapterChanged','MachineStateChanged'],
					settingsLink: 'Network',
					rows: function(d) {
						
						var vboxDetailsTableNics = 0;
						var rows = [];
						
						
						for(var i = 0; i < d['networkAdapters'].length; i++) {
							
							nic = d['networkAdapters'][i];
							
							// compose extra info
							var adp = '';

							if(nic.enabled) {
								vboxDetailsTableNics++;
								switch(nic.attachmentType) {
									case 'Null':
										adp = vcube.utils.trans('Not attached','VBoxGlobal');
										break;
									case 'Bridged':
										adp = vcube.utils.trans('Bridged adapter, %1','VBoxGlobal').replace('%1', nic.bridgedInterface);
										break;
									case 'HostOnly':
										adp = vcube.utils.trans('Host-only adapter, \'%1\'','VBoxGlobal').replace('%1', nic.hostOnlyInterface);
										break;
									case 'NAT':
										// 'NATNetwork' ?
										adp = vcube.utils.trans('NAT','VBoxGlobal');
										break;
									case 'Internal':
										adp = vcube.utils.trans('Internal network, \'%1\'','VBoxGlobal').replace('%1', Ext.String.htmlEncode(nic.internalNetwork));
										break;
									case 'Generic':
										// Check for properties
										if(nic.properties) {
											adp = vcube.utils.trans('Generic driver, \'%1\' { %2 }','UIDetailsPagePrivate').replace('%1', nic.genericDriver);
											var np = [];
											Ext.iterate(nic.properties, function(k,v) {
												np.push(Ext.String.htmlEncode(k)+'='+Ext.String.htmlEncode(v));
											})
											adp = adp.replace('%2', np.join(", "));
											break;
										}
										adp = vcube.utils.trans('Generic driver, \'%1\'','UIDetailsPagePrivate').replace('%1', nic.genericDriver);
										break;					
									case 'VDE':
										adp = vcube.utils.trans('VDE network, \'%1\'','VBoxGlobal').replace('%1', nic.VDENetwork);
										break;
								}

								rows[rows.length] = {
									title: vcube.utils.trans("Adapter %1",'VBoxGlobal').replace('%1',(i + 1)),
									data: vcube.utils.trans(vcube.utils.vboxNetworkAdapterType(nic.adapterType)).replace(/\(.*\)/,'') + ' (' + adp + ')'
								};
							}
									
						}
						
						// No enabled nics
						if(vboxDetailsTableNics == 0) {
							
							rows[rows.length] = {
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (network)')+'</span>',
								html: true
							};
							
						// Link nic to guest networking info?
						} else if(d['state'] == 'Running') {
							
							rows[rows.length] = {
								title: '',
								data: '<a href="javascript:vboxGuestNetworkAdaptersDialogInit(\''+d['id']+'\');">('+vcube.utils.trans('Guest Network Adapters','VBoxGlobal')+')</a>',
								html: true
							};
							
						}
						
						return rows;

					}
				},
				
				/*
				 * Serial Ports
				 */
				serialports : {
					
					icon: 'serial_port_16px.png',
					title: vcube.utils.trans('Serial Ports'),
					settingsLink: 'SerialPorts',
					rows: function(d) {
						
						var rows = [];
						
						var vboxDetailsTableSPorts = 0;
						for(var i = 0; i < d['serialPorts'].length; i++) {
							
							p = d['serialPorts'][i];
							
							if(!p.enabled) continue;
							
							// compose extra info
							var xtra = vcube.utils.vboxSerialPorts.getPortName(p.IRQ,p.IOBase);
							
							var mode = p.hostMode;
							xtra += ', ' + vcube.utils.trans(vcube.utils.vboxSerialMode(mode),'VBoxGlobal');
							if(mode != 'Disconnected') {
								xtra += ' (' + p.path + ')';
							}
							
							rows[rows.length] = {
								title: vcube.utils.trans("Port %1",'VBoxGlobal',null,'details report (serial ports)').replace('%1',(i + 1)),
								data: xtra,
								html: true
							};
							
							vboxDetailsTableSPorts++;
									
						}
						
						if(vboxDetailsTableSPorts == 0) {
							rows = [{
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (serial ports)')+'</span>',
								data: '',
								html: true
							}];
						}
						
						return rows;
					
					}
				},
				
				/*
				 * Parallel ports
				 */
				parallelports: {
					icon: 'parallel_port_16px.png',
					title: vcube.utils.trans('Parallel Ports','UIDetailsPagePrivate'),
					settingsLink: 'ParallelPorts',
					condition: function() { return false; },
					rows: function(d) {
						
						var rows = [];
						
						var vboxDetailsTableSPorts = 0;
						for(var i = 0; i < d['parallelPorts'].length; i++) {
							
							p = d['parallelPorts'][i];
							
							if(!p.enabled) continue;
							
							// compose extra info
							var xtra = vcube.utils.trans(vcube.utils.vboxParallelPorts.getPortName(p.IRQ,p.IOBase));
							xtra += ' (' + p.path + ')';
							
							rows[rows.length] = {
								title: vcube.utils.trans("Port %1",'VBoxGlobal',null,'details report (parallel ports)').replace('%1',(i + 1)),
								data: xtra
							};
							vboxDetailsTableSPorts++;
									
						}
						
						if(vboxDetailsTableSPorts == 0) {
							rows[0] = {
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('Disabled','VBoxGlobal',null,'details report (parallel ports)')+'</span>',
								html: true
							};
						}
						return rows;
						
					}
				},
				
				/*
				 * USB
				 */
				usb : {
					icon: 'usb_16px.png',
					title: vcube.utils.trans('USB'),
					settingsLink: 'USB',
					rows: function(d) {
						
						var rows = [];
						
						var usbEnabled = false;
						for(var i = 0; i < d.USBControllers.length; i++) {
							if(d.USBControllers[i].type == 'OHCI') {
								usbEnabled = true;
								break;
							}
						}
						if(usbEnabled) {
							var tot = 0;
							var act = 0;
							for(var i = 0; i < d.USBDeviceFilters.length; i++) {
								tot++;
								if(d.USBDeviceFilters[i].active) act++;
							}
							
							rows[0] = {
								title: vcube.utils.trans("Device Filters"),
								data: vcube.utils.trans('%1 (%2 active)').replace('%1',tot).replace('%2',act)
							};
							
						} else {
							
							rows[0] = {
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans("Disabled",null,null,'details report (USB)')+'</span>',
								html: true
							};
						}
						
						return rows;

					}
				},
				
				/*
				 * Shared folders list
				 */
				sharedfolders : {
					icon: 'sf_16px.png',
					title: vcube.utils.trans('Shared Folders', 'UIDetailsPagePrivate'),
					settingsLink: 'SharedFolders',
					rows: function(d) {

						if(!d['sharedFolders'] || d['sharedFolders'].length < 1) {
							return [{
								title: '<span class="vboxDetailsNone">'+vcube.utils.trans('None',null,null,'details report (shared folders)')+'</span>',
								html: true
							}];
						}
						
						return [{
								title: vcube.utils.trans('Shared Folders', 'UIDetailsPagePrivate'),
								data: d['sharedFolders'].length
							}];
					}
				}
			}

	}
});
	
