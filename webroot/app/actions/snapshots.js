/**
 * Snapshot actions
 */
Ext.define('vcube.actions.snapshots',{

	statics: {
	
		take: {
			
			enabled_test: function(ss, vm) {
	  			
	  			return (ss && ss.id == 'current' && !Ext.Array.contains(['RestoringSnapshot','LiveSnapshotting','DeletingSnapshot','Starting','PoweringOff'], vm.state));
	  		},
	  		
	
	  		action : function (ss, vm, rootNode) {
	
	  			/* Since this could be called from restore snapshot,
	  			 * return a deferred object
	  			 */
	  			var promise = Ext.create('Ext.ux.Deferred');
	  			
	  			/* Elect SS name */
	  			var ssNumber = 1; //vm.snapshotCount + 1;
	  			var ssName = vcube.utils.trans('Snapshot %1','VBoxSnapshotsWgt').replace('%1', ssNumber);
	  			
	  			while(rootNode.findChildBy(function(node){
	  				return (node.get('name') == ssName);
	  				},this,true)) {
	  				
	  				ssName = vcube.utils.trans('Snapshot %1','VBoxSnapshotsWgt').replace('%1', ++ssNumber);
	  			}
	
	  			Ext.create('vcube.view.VMSnapshots.TakeSnapshot',{
	  				listeners: {
	  					show: function(win) {
	  						
	  						win.down('#osimage').setSrc("images/vbox/" + vcube.utils.vboxGuestOSTypeIcon(vm.OSTypeId));
	  						
	  						win.down('#form').getForm().setValues({name:ssName});
	  						
	  						win.down('#ok').on('click',function(btn){
	  							
	  							
	  							win.setLoading(true);
	  							
	  							// Suspend events so that we don't get the task update before
	  							// we tell the application to watch for it
	  							vcube.app.suspendEvents(true);
	  							
	  							// Take snapshot 
	  							Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/snapshotTake',
	  									Ext.apply(win.down('#form').getForm().getValues(), vcube.utils.vmAjaxParams(vm.id))),{watchTask:true})
	  								.done(function(data) {
	  									promise.resolve(data);
	  									win.close();
		  							})
			  						.fail(function() {
			  							promise.reject('taking snapshot failed');
			  							win.setLoading(false);			  								
		  							}).always(function(){
		  								vcube.app.resumeEvents();
		  							});
	  						});
	  						win.down('#cancel').on('click',function(){
	  							promise.reject('snapshot window closed');
	  						});
	  					}
	  				}
	  			}).show();
	
	  			return promise;
	  					  			
	  			
	  	  	}
	  	},
	  	
	  	/*
	  	 * Restore a snapshot
	  	 */
	  	restore: {
	  		
	  		enabled_test: function(ss, vm) {
	  			
	  			return (ss && ss.id != 'current' && !vcube.utils.vboxVMStates.isRunning(vm) && !vcube.utils.vboxVMStates.isPaused(vm));
	  		},
	  		
	  		action : function (snapshot, vm, rootNode) {
	  			
	  			
				var buttons = {};
				var q = '';
				
				// Check if the current state is modified
				if(vm.currentStateModified) {
	
					q = vcube.utils.trans("<p>You are about to restore snapshot <nobr><b>%1</b></nobr>.</p>" +
	                        "<p>You can create a snapshot of the current state of the virtual machine first by checking the box below; " +
	                        "if you do not do this the current state will be permanently lost. Do you wish to proceed?</p>",'UIMessageCenter');
					q += '<p><label><input type="checkbox" checked /> ' + vcube.utils.trans('Create a snapshot of the current machine state','UIMessageCenter') + '</label></p>';
					
					var buttons = [{
						
						text: vcube.utils.trans('Restore','UIMessageCenter'),
	
						listeners: {
							
							click: function(btn) {
								
								var snrestore = function(){
									
									btn.up('.window').close();
									vcube.utils.ajaxRequest('vbox/snapshotRestore', Ext.apply({'snapshot':snapshot.id}, vcube.utils.vmAjaxParams(vm.id)));										
									
								};
								
								if(Ext.select('input[type=checkbox]',btn.up('.window').getEl().dom).elements[0].checked) {
	
									Ext.ux.Deferred.when(vcube.actions.snapshots.take.action(snapshot, vm, rootNode))
										.done(function(sntakepromise) {
											
											// Show progress window
		    								var pwin = Ext.create('vcube.view.common.ProgressWindow',{
		    									operation: {
		    										actionType: 'snapshots',
		    										actionName: 'take'
		    									}
		    								}).show();
	
											Ext.ux.Deferred.when(sntakepromise)
												.progress(function(pct, text){
													pwin.updateProgress(pct, text);
												}).done(function(){
													snrestore();
												}).always(function(){
													// close progress window
													pwin.close();
												})
										});
									
								} else {
									snrestore();
								}
							}
						}
						
					}];
	
				} else {
					
					q = vcube.utils.trans('<p>Are you sure you want to restore snapshot <nobr><b>%1</b></nobr>?</p>','UIMessageCenter');
					
					var buttons = [{
						text: vcube.utils.trans('Restore','UIMessageCenter'),
						listeners: {
							click: function(btn) {
								
								btn.up('.window').close()
								vcube.utils.ajaxRequest('vbox/snapshotRestore', Ext.apply({'snapshot':snapshot.id}, vcube.utils.vmAjaxParams(vm.id)));
							}
						}
	
				
					}];
				}
	
				vcube.utils.confirm(q.replace('%1',Ext.String.htmlEncode(snapshot.name)),buttons);
	  	  	},
	  	},
	  	
	  	/*
	  	 * Delete snapshot
	  	 */
	  	'delete' : {
	  		
	  		enabled_test: function(ss, vm) {
	  			return (ss && ss.id != 'current'); // && ss.children.length <= 1);
	  		},
	  		
	  		action : function (ss, vm) {
	  			
				var buttons = [{
					text: vcube.utils.trans('Delete','UIMessageCenter'),
					listeners: {
						click: function(btn) {
							btn.up('.window').close()
							vcube.utils.ajaxRequest('vbox/snapshotDelete', Ext.apply({'snapshot':ss.id}, vcube.utils.vmAjaxParams(vm.id)));
						}
					}
				}];
				
				vcube.utils.confirm(vcube.utils.trans('<p>Deleting the snapshot will cause the state information saved in it to be lost, and disk data spread over several image files that VirtualBox has created together with the snapshot will be merged into one file. This can be a lengthy process, and the information in the snapshot cannot be recovered.</p></p>Are you sure you want to delete the selected snapshot <b>%1</b>?</p>','UIMessageCenter').replace('%1',Ext.String.htmlEncode(ss.name)),buttons);
	  	  	}
	  	},
	  	
	  	/*
	  	 * CLone
	  	 */
	  	clone: {
	  		
	  		enabled_test: function(ss, vm) { 
	  			return (ss && !vcube.utils.vboxVMStates.isPaused(vm) && !vcube.utils.vboxVMStates.isRunning(vm));
	  		},
	  		action : function (ss, vm) {
	
	  	  		new vboxWizardCloneVMDialog({'vm':vm,'snapshot':(ss.id == 'current' ? undefined : ss)}).run();
	  			
	  	  	}
	  	},
	  	
	  	/*
	  	 * Show snapshot details
	  	 */
	  	show: {
	  		
	  		enabled_test: function(ss, vm) {
	  			return (ss && ss.id != 'current');
	  		},
	  		
	  		action : function (snapshot, vm) {
	
	  			
	  			var win = Ext.create('vcube.view.VMSnapshots.Details');
	  			win.show();
	  			win.setLoading(true);
	  			
	  			Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/snapshotGetDetails', Ext.apply({'snapshot':snapshot.id},vcube.utils.vmAjaxParams(vm.id))))
	  				.done(function(data) {
		  				
	
	  					win.setTitle('Details of ' + Ext.String.htmlEncode(data.name) + ' (' + vm.name + ')');
	  					
		  				data.machine._isSnapshot = true;
	
		  				// Set basic values
						win.down('#form').getForm().setValues({'name':data.name,'description':data.description});
						
						win.down('#taken').setValue(vcube.utils.dateTimeString(data.timeStamp));
						
						// Preview image
						if(data.online) {
							var params = Ext.apply({'snapshot':snapshot.id},vcube.utils.vmAjaxParams(vm.id));
							win.down('#preview').setValue('<a href="vbox/machineGetScreenShot?' + Ext.urlEncode(params)+'&full=1" target=_new><img src="vbox/machineGetScreenShot?' + Ext.urlEncode(params) + '" /></a>');
						} else {
							win.down('#preview').hide();
						}
						
						// Add details
						var sectionsPane = win.down('#details');
						for(var i in vcube.view.VMDetails.sections) {
							
							if(typeof(i) != 'string') continue;
							
							if(vcube.view.VMDetails.sections[i].condition && !vcube.view.VMDetails.sections[i].condition(data.machine)) continue;
							
							sectionsPane.add(Ext.create('vcube.widget.SectionTable',{
								sectionCfg: vcube.view.VMDetails.sections[i],
								'data': data.machine,
								name: i}));
							
						}
						
						win.down('#ok').on('click',function(btn){
							var vals = win.down('#form').getForm().getValues();
							win.setLoading(true);
							Ext.ux.Deferred.when(vcube.utils.ajaxRequest('vbox/snapshotSave',Ext.apply({'snapshot':snapshot.id,'name':vals.name,'description':vals.description},vcube.utils.vmAjaxParams(vm.id))))
								.done(function(){
									win.close();										
								})
								.always(function(){
									win.setLoading(false);
								});
							
						});
						
						win.setLoading(false);
	 
	  				})
	  				
	  				.fail(function(){
	  					win.setLoading(false);
	  				});
	  			
	  	  	}
	  	}	  	

	}
});
