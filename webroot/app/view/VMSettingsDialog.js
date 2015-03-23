Ext.define('vcube.view.VMSettingsDialog',{

	extend: 'vcube.widget.SettingsDialog',
	alias: 'view.VMSettingsDialog',
	
	title: '{0} - Settings',
	
	width: 800,
	
	
	requires: ['vcube.form.field.ostype', 'vcube.form.field.usbcontrollers',
	           'vcube.form.field.usbfilters', 'vcube.form.field.networkadapters',
	           'vcube.form.field.serialports', 'vcube.form.field.parallelports',
	           'vcube.form.field.sharedfolders', 'vcube.form.field.storage',
	           'vcube.widget.fsbrowser', 'vcube.form.field.folderbrowser',
	           'vcube.form.field.serverstorecombo', 'vcube.form.field.icon'],
	           
	
	dialogDataURL: 'vbox/vboxGetVMSettingsDefs',
		
	getSections: function(dlgData) {
		
		return [{
			name: 'General',
			label:'General',
			image:'machine',
			xtype: 'tabpanel',
			items: [{
				title: 'Basic',
				items: [{
					xtype: 'textfield',
					fieldLabel: 'Name',
					name: 'name'
				},{
					xtype: 'ostypefield',
					name: 'OSTypeId'
				},{
					xtype: 'iconfield',
					name: 'icon'
				}]
			},{
				title: 'Advanced',
				defaults: {
					labelWidth: 150,
					labelAlign: 'right'
				},
				items: [{
					xtype: 'folderbrowser',
					labelWidth: 150,
					labelAlign: 'right',
					fieldLabel: 'Snapshot Folder',
					name: 'snapshotFolder'
				},{
					xtype: 'checkbox',
					fieldLabel: 'Removable Media',
					name: 'GUI.SaveMountedAtRuntime',
					boxLabel: 'Remember Runtime Changes',
					inputValue: "yes",
					uncheckedValue: "no"
				}]
			},{
				title: 'Description',
				layout: 'fit',
				items: [{
					xtype: 'textarea',
					width: '100%',
					name: 'description'
				}]
			}]
		},{
			name:'System',
			label:'System',
			image:'chipset',
			xtype: 'tabpanel',
			items: [{
				title: 'Motherboard',
				defaults: {
					labelWidth: 150,
					labelAlign: 'right'
				},
				items: [{
					fieldLabel: 'Base Memory',
					xtype: 'vcubesliderfield',
					maxValue: dlgData.maxGuestRAM,
					minValue: dlgData.minGuestRAM,
					valueLabel: 'MB',
					name: 'memorySize'
				},{
					fieldLabel: 'Boot Order',
					xtype: 'bootorderfield',
					name: 'bootOrder'
				},{
					fieldLabel: 'Chipset',
					xtype: 'serverstorecombo',
					editable: false,
					name: 'chipsetType',
					store: Ext.create('vcube.data.VboxEnumStore',{
						enumClass: 'ChipsetType',
						ignoreNull: true,
						enumData: dlgData.enums.ChipsetType
					})
				},{
					fieldLabel: 'Extended Features',
					xtype: 'checkbox',
					inputValue: true,
					boxLabel: 'Enable I/O APIC',
					name: 'BIOSSettings.IOAPICEnabled'
				},{
					xtype: 'checkbox',
					fieldLabel: ' ',
					labelSeparator: '',
					boxLabel: 'Enable EFI (special OSes only)',
					name: 'firmwareType',
					uncheckedValue: "BIOS",
					inputValue: "EFI"
				},{
					xtype: 'checkbox',
					fieldLabel: ' ',
					labelSeparator: '',
					boxLabel: 'Hardware Clock in UTC Time',
					name: 'RTCUseUTC',
					inputValue: true
				}]
			},{
				title: 'Processor',
				defaults: {
					labelWidth: 150,
					labelAlign: 'right'
				},
				items: [{
					fieldLabel: 'Processor(s)',
					xtype: 'vcubesliderfield',
					maxValue: dlgData.maxGuestCPUCount,
					minValue: dlgData.minGuestCPUCount,
					valueLabel: 'CPU(s)',
					hideValueBox: true,
					name: 'CPUCount'
				},{
					fieldLabel: 'Execution Cap',
					xtype: 'vcubesliderfield',
					maxValue: 100,
					minValue: 1,
					valueLabel: '%',
					hideValueBox: true,
					name: 'CPUExecutionCap'
				},{
					fieldLabel: 'Extended Features',
					xtype: 'checkbox',
					inputValue: true,
					boxLabel: 'Enable PAE/NX',
					name: 'CpuProperties.PAE'
				}]
				
			},{
				title: 'Acceleration',
				items: [{
					fieldLabel: 'Hardware Virtualization',
					labelWidth: 200,
					xtype: 'checkbox',
					inputValue: true,
					boxLabel: 'Enable VT-x/AMD-V',
					name: 'HWVirtExProperties.Enabled',
					listeners: {
						change: function(cb, val) {
							cb.ownerCt.down('[name=HWVirtExProperties.NestedPaging]').setDisabled(!val);
						}
					}
				},{
					xtype: 'checkbox',
					inputValue: true,
					fieldLabel: ' ',
					labelSeparator: '',
					boxLabel: 'Enable Nested Paging',
					disabled: true,
					name: 'HWVirtExProperties.NestedPaging'
				}]
			}]
		},{
			name:'Display',
			label:'Display',
			image:'vrdp',
			xtype: 'tabpanel',
			items: [{
				title: 'Video',
				items: [{
					fieldLabel: 'Video Memory',
					xtype: 'vcubesliderfield',
					maxValue: dlgData.maxGuestRAM,
					minValue: dlgData.minGuestRAM,
					valueLabel: 'MB',
					name: 'VRAMSize'
	
				}]
			},{
				title: 'Remote Display',
				defaults: {
					labelWidth: 150,
					labelAlign: 'right',
					disabled: true
				},
				items: [{
					xtype: 'checkbox',
					inputValue: true,
					boxLabel: 'Enable Server',
					name: 'VRDEServer.enabled',
					disabled: false,
					listeners: {
						change: function(cb, val) {
							Ext.each(['ports','authType','authTimeout','allowMultiConnection'], function(name){
								cb.ownerCt.down('[name=VRDEServer.' + name + ']').setDisabled(!val);
							});
						}
					}
				},{
					xtype: 'textfield',
					fieldLabel: 'Server Port',
					name: 'VRDEServer.ports'
				},{
					xtype: 'serverstorecombo',
					editable: false,
					fieldLabel: 'Authentication Method',
					name: 'VRDEServer.authType',
					store: Ext.create('vcube.data.VboxEnumStore',{
						enumClass: 'AuthType',
						enumData: dlgData.enums.AuthType
					})
	
				},{
					xtype: 'numberfield',
					fieldLabel: 'Authentication Timeout',
					name: 'VRDEServer.authTimeout',
					minValue: 0
				},{
					xtype: 'checkbox',
					inputValue: true,
					fieldLabel: 'Extended Features',
					boxLabel: 'Allow Multiple Connections',
					name: 'VRDEServer.allowMultiConnection'
				}]
			}]
		},{
			name:'storageControllers',
			label:'Storage',
			xtype: 'storagefield',
			image:'attachment',
			serverData: dlgData
		},{
			name:'audioAdapter',
			label:'Audio',
			image:'sound',
			layout: 'form',
			frame: true,
			defaults: {
				disabled: true
			},
			items: [{
				xtype: 'checkbox',
				boxLabel: 'Enable Audio',
				name: 'audioAdapter.enabled',
				inputValue: true,
				disabled: false,
				listeners: {
					change: function(cb, val) {
						cb.ownerCt.down('[name=audioAdapter.audioDriver]').setDisabled(!val);
						cb.ownerCt.down('[name=audioAdapter.audioController]').setDisabled(!val);
					}
				}
			},{
				xtype: 'serverstorecombo',
				editable: false,
				fieldLabel: 'Host Audio Driver',
				name: 'audioAdapter.audioDriver',
				store: Ext.create('vcube.data.VboxEnumStore',{
					enumClass: 'AudioDriverType',
					conversionFn: vcube.utils.vboxAudioDriver,
					enumData: dlgData.enums.AudioDriverType
				})
			},{
				xtype: 'serverstorecombo',
				editable: false,
				fieldLabel: 'Audio Controller',
				name: 'audioAdapter.audioController',
				store: Ext.create('vcube.data.VboxEnumStore',{
					enumClass: 'AudioControllerType',
					conversionFn: vcube.utils.vboxAudioController,
					enumData: dlgData.enums.AudioControllerType
				})
			}]
		},{
			label:'Network',
			image:'nw',
			xtype: 'networkadaptersfield',
			name: 'networkAdapters',
			serverData: dlgData
		},{
			label:'Serial Ports',
			xtype: 'serialportsfield',
			image:'serial_port',
			name: 'serialPorts',
			serverData: dlgData
		},{
			label:'Parallel Ports',
			image:'parallel_port',
			name:'parallelPorts',
			xtype: 'parallelportsfield',
			serverData: dlgData
		},{
			name:'USB',
			label:'USB',
			image:'usb',
			layout: {
				type: 'vbox',
				align: 'stretch',
				pack: 'start'
			},
			defaults: {
				border: true
			},
			items: [{
				xtype: 'usbcontrollersfield',
				name: 'USBControllers'
			},{
				xtype: 'usbfiltersfield',
				name: 'USBDeviceFilters',
				flex: 1
			}]
		},{
			name:'sharedFolders',
			label:'Shared Folders',
			image:'sf',
			xtype: 'sharedfoldersfield'
		}]
	}		
});