/**
 * Server Host tab
 * 
 */

Ext.define('vcube.view.ServerHost', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.ServerHost',

    title: 'Host',
    
    icon: 'images/vbox/OSE/VirtualBox_cube_42px.png',
    iconCls: 'icon16',
    itemId: 'sectionspane',
    
    cls: 'vmTabDetails',
    autoScroll: true,
    layout: 'vbox',
    width: '100%',
    
    defaults: { xtype: 'panel', width: '100%', margin: '0 10 10 10' },
    style : { background: '#f9f9f9' },
    bodyStyle : { background: '#f9f9f9' },

    html: '',
    
	statics : {
		
		sections: {
			
			/*
			 * General
			 */
			hostgeneral: {
				icon:'machine_16px.png',
				title:vcube.utils.trans('General','VBoxGlobal'),
				settingsLink: 'General',
				rows : [{
					   title: vcube.utils.trans('Hostname', 'VBoxGlobal'),
					   attrib: 'hostname'
				   },{
					   title: vcube.utils.trans('OS Type', 'VBoxGlobal'),
					   renderer: function(d) {
						   return d['operatingSystem'] + ' (' + d['OSVersion'] +')';
					   }
				   },{
					   title: vcube.utils.trans('Memory'),
					   renderer: function(d) {
						   return vcube.utils.trans('<nobr>%1 MB</nobr>').replace('%1',d['memorySize']);
					   }
				   },{
					   title: '',
					   data: '<span id="vboxHostMemUsed"><div style="background-color:#a33" id="vboxHostMemUsedPct"><div style="background-color:#a93;float:right;" id="vboxHostMemResPct"></div></div><div style="width:100%;position:relative;top:-14px;left:0px;text-align:center;"><span id="vboxHostMemUsedLblPct" style="float:left" /><span id="vboxHostMemFreeLbl" style="float:right" /></div></span>'
				   },{
					   title: vcube.utils.trans("Processor(s)",'VBoxGlobal'),
					   renderer: function(d) {
						   return d['cpus'][0] + ' (' + d['cpus'].length +')';
					   }
				   },{
					   title: '',
					   renderer: function(d) {
					
						   // Processor features?
							var cpuFeatures = new Array();
							for(var f in d.cpuFeatures) {
								if(!d.cpuFeatures[f]) continue;
								cpuFeatures[cpuFeatures.length] = vcube.utils.trans(f);
							}
							return cpuFeatures.join(', ');
							
					   },
					   condition: function(d) {
						   if(!d.cpuFeatures) return false;
						   for(var f in d.cpuFeatures) {
							   if(!d.cpuFeatures[f]) continue;
							   return true;
							}
							return false;
					   }
				}],
			},
				   
			hostnetwork: {
				title: vcube.utils.trans('Network'),
				icon: 'nw_16px.png',
				rows: function(d) {
					
					var netRows = [];
					
					for(var i = 0; i < d['networkInterfaces'].length; i++) {		
						
						/* Interface Name */
						netRows[netRows.length] = {
							title: d['networkInterfaces'][i].name + ' (' + vcube.utils.trans(d['networkInterfaces'][i].status,'VBoxGlobal') + ')',
							data: ''
						};
						
	
						/* IPv4 Addr */
						if(d['networkInterfaces'][i].IPAddress){
							
							netRows[netRows.length] = {
								title: vcube.utils.trans('IPv4 Address','UIGlobalSettingsNetwork'),
								data: d['networkInterfaces'][i].IPAddress + ' / ' + d['networkInterfaces'][i].networkMask,
								indented: true
							};
							
						}
						
						/* IPv6 Address */
						if(d['networkInterfaces'][i].IPV6Supported && d['networkInterfaces'][i].IPV6Address) {
							
							netRows[netRows.length] = {
								title: vcube.utils.trans('IPv6 Address','UIGlobalSettingsNetwork'),
								data: d['networkInterfaces'][i].IPV6Address + ' / ' + d['networkInterfaces'][i].IPV6NetworkMaskPrefixLength,
								indented: true
							};
						}
						
						/* Physical info */
						netRows[netRows.length] = {
							title: '',
							data: vcube.utils.trans(d['networkInterfaces'][i].mediumType) + (d['networkInterfaces'][i].hardwareAddress ? ' (' + d['networkInterfaces'][i].hardwareAddress + ')' : ''),
							indented: true
						};
						
									
					}
					return netRows;
				}
			}
		}
	}    	
});
