/*
 * There can be only one instance of this
 */
Ext.define('vcube.widget.PreviewMonitor',{

	extend: 'Ext.panel.Panel',
	alias: 'widget.PreviewMonitor',
	
	title: 'Preview',
	icon: 'images/vbox/vrdp_16px.png',

	autoWidth: true,
	autoHeight: true,
	bodyStyle: {
	    background: '#fff'
	},
	border: true,
	
	elementId: 'vcube-widget-previewbox',

	/**
	 * Apply options and hold ref to component
	 */
	constructor: function(options) {
		
		Ext.apply(this,options);
		
		vcube.widget.PreviewMonitor.component = this;
		
		vcube.widget.PreviewMonitor.previewImg.src = vcube.widget.PreviewMonitor.defaultImage
		vcube.widget.PreviewMonitor.previewImg.onload = vcube.widget.PreviewMonitor.previewImgOnload;
		
		this.callParent(arguments);
	},
	

	/* Hold canvas element after render */
	listeners: {
		
		afterrender: function(panel) {
			
			// Get update interval from local settings
			vcube.widget.PreviewMonitor.previewUpdateInterval = parseInt(vcube.app.localConfig.get('previewUpdateInterval')) || 5;
			
			// Create target div and hold ref to it
			panel.update('<div id="' + panel.elementId +'" />');
			vcube.widget.PreviewMonitor.targetDiv = document.getElementById(panel.elementId);
			
			// Open preview in new window on click
			Ext.get(panel.elementId).on('click', function() {
				
				if(vcube.utils.vboxVMStates.isOneRecord(['Running','Saved'],[vcube.widget.PreviewMonitor.vmrecord]))
						window.open('vbox/machineGetScreenShot?' + Ext.urlEncode(Ext.apply({full:1},vcube.utils.vmAjaxParams(vcube.widget.PreviewMonitor.vmrecord.getData()))));
			});
			
			// Context menu
			var menu = Ext.create('Ext.menu.Menu', {
	    	    renderTo: Ext.getBody(),
	    	    defaults: {
	    	    	xtype: 'menucheckitem',
	    	    	checked: false,
	    	    	group: 'vcubePreviewUpdateInterval',
	    	    	checkHandler : function(item, checked) {
	    	    		if(checked) {
	    	    			vcube.widget.PreviewMonitor.previewUpdateInterval = item.value;
	    	    			vcube.app.localConfig.set('previewUpdateInterval', parseInt(item.value));
	    	    			panel.reconfigure(vcube.widget.PreviewMonitor.vmrecord.get('id'));
	    	    		}
	    	    	}
	    	    },
	    	    items: [{
	    	    	text: 'Every 3 seconds',
	    	    	value: 3,
	    	    	checked: (vcube.widget.PreviewMonitor.previewUpdateInterval == 3)
	    	    },{
	    	    	text: 'Every 5 seconds',
	    	    	value: 5,
	    	    	checked: (vcube.widget.PreviewMonitor.previewUpdateInterval == 5)
	    	    },{
	    	    	text: 'Every 10 seconds',
	    	    	value: 10,
	    	    	checked: (vcube.widget.PreviewMonitor.previewUpdateInterval == 10)
	    	    },{
	    	    	text: 'Every 30 seconds',
	    	    	value: 30,
	    	    	checked: (vcube.widget.PreviewMonitor.previewUpdateInterval == 30)
	    	    },{
	    	    	xtype: 'menuseparator'
	    	    },{
	    	    	text: 'Update disabled',
	    	    	value: 0,
	    	    	checked: (vcube.widget.PreviewMonitor.previewUpdateInterval == 0)
	    	    }]
	    	});
			
			Ext.get(panel.elementId).on('contextmenu',function(e) {
	    		e.stopEvent();
				menu.showAt(e.getXY());
	    	});
			
			// Subscribe to state change events
			vcube.app.on('MachineStateChanged',function(eventData) {
				
				if(!vcube.widget.PreviewMonitor.previewUpdateInterval || !vcube.widget.PreviewMonitor.vmrecord || vcube.widget.PreviewMonitor.vmrecord.get('id') != eventData.machineId)
					return;
				
				this.updatePreview(eventData);
				
			}, this);
			
		}
	},
	
	/* Update preview - State or VM change */
	updatePreview: function(vm) {
		
		// VM must at least contain state and id
		
		// Clear interval if set
		vcube.widget.PreviewMonitor.clearUpdateTimer();

		// redraw VM preview?
		if(vcube.widget.PreviewMonitor.previewUpdateInterval && (vcube.utils.vboxVMStates.isRunning(vm) || vcube.utils.vboxVMStates.isSaved(vm))) {
			vcube.widget.PreviewMonitor.targetDiv.style.cursor = 'pointer';
			vcube.widget.PreviewMonitor.loadVMImage();
		} else {
			this.drawDefaultImage();
		}
		
	},
	
	/* Draw default background? */
	drawDefaultImage: function() {
		vcube.widget.PreviewMonitor.targetDiv.style.cursor = '';
		if(vcube.widget.PreviewMonitor.previewImg.src && vcube.widget.PreviewMonitor.previewImg.src.substr(-vcube.widget.PreviewMonitor.defaultImage.length) == vcube.widget.PreviewMonitor.defaultImage)
			return;
		
		vcube.widget.PreviewMonitor.previewImg.src = vcube.widget.PreviewMonitor.defaultImage;
	},
	
	
	/* Configure with VM */
	reconfigure: function(vmid) {
		
		// Only bother if vm has changed */
		if(vcube.widget.PreviewMonitor.vmrecord && vcube.widget.PreviewMonitor.vmrecord.get('id') == vmid)
			return;
		
		// Set VM record
		vcube.widget.PreviewMonitor.vmrecord = vcube.storemanager.getStoreRecord('vm',vmid);
		
		// Check for cached resolution
		if(vcube.widget.PreviewMonitor.resolutionCache[vmid]) {				
			height = vcube.widget.PreviewMonitor.resolutionCache[vmid].height;
		} else {
			height = parseInt(vcube.widget.PreviewMonitor.previewWidth / vcube.widget.PreviewMonitor.previewAspectRatio);
		}

		// Update disabled? State not Running or Saved
		if(vcube.widget.PreviewMonitor.previewUpdateInterval && (vcube.utils.vboxVMStates.isOneRecord(['Running','Saved'],[vcube.widget.PreviewMonitor.vmrecord]))) {

			// blank out monitor if we are about to draw a generated image
			vcube.widget.PreviewMonitor.drawPreview(null, vcube.widget.PreviewMonitor.previewWidth, height);
			this.doLayout();
			
		}

		this.updatePreview(vcube.widget.PreviewMonitor.vmrecord.getData());
		
	},
	


	statics: {
	
		/* Div element where canvas will be drawn */
		targetDiv: null,
		
		/* Ext component */
		component: null,
		
		/* Update interval */
		previewUpdateInterval: 5,
		
		/* Aspect ration for preview window */
		previewAspectRatio : 1.6,
		
		/* Holds preview dimension cache */
		resolutionCache : {},
		
		/* Preview width by default */
		previewWidth: 200,

		/* Default background image for monitor */
		defaultImage : 'images/vbox/OSE/VirtualBox_cube_42px.png',
		//defaultImageSize: 64,
		
		/*
		 * Clear update timer if set
		 */
		clearUpdateTimer: function() {
		
			// Clear interval if set
			var timer = vcube.widget.PreviewMonitor.previewTimer;
			if(timer) window.clearInterval(timer);
			vcube.widget.PreviewMonitor.previewTimer = null;

		},
		
		/*
		 * Preview image
		 */
		previewImg: new Image(),
		
		previewImgOnload: function() {
			
			var width = vcube.widget.PreviewMonitor.previewWidth;
			
			var vmid = (vcube.widget.PreviewMonitor.vmrecord ? vcube.widget.PreviewMonitor.vmrecord.get('id') : null);
			
			// Set and cache dimensions
			if(this.height > 0 && vmid) {
				
				// If width != requested width, it is scaled
				if(this.width != vcube.widget.PreviewMonitor.previewWidth) {
					height = this.height * (vcube.widget.PreviewMonitor.previewWidth / this.width);
				// Not scaled
				} else {					
					height = this.height;							
				}
	
				vcube.widget.PreviewMonitor.resolutionCache[vmid] = {
					'height':height
				};
	
			// Height of image is 0
			} else if (vmid) {
				
				// Check for cached resolution
				if(vcube.widget.PreviewMonitor.resolutionCache[vmid]) {				
					height = vcube.widget.PreviewMonitor.resolutionCache[vmid].height;
				} else {
					height = parseInt(width / vcube.widget.PreviewMonitor.previewAspectRatio);
				}
				
				// Clear interval if set
				vcube.widget.PreviewMonitor.clearUpdateTimer();
				
			// No vmid
			} else {
				height = parseInt(width / vcube.widget.PreviewMonitor.previewAspectRatio);
			}
			
			// Canvas redraw
			if((this.src.substr(-vcube.widget.PreviewMonitor.defaultImage.length) == vcube.widget.PreviewMonitor.defaultImage)) {
				vcube.widget.PreviewMonitor.drawPreview(this, width, parseInt(width / vcube.widget.PreviewMonitor.previewAspectRatio), true);
			} else {
				vcube.widget.PreviewMonitor.drawPreview((this.height <= 1 ? null : this), width, height);				
			}
			
			vcube.widget.PreviewMonitor.component.doLayout();
			
			if(vcube.widget.PreviewMonitor.vmrecord && vcube.widget.PreviewMonitor.previewUpdateInterval && (vcube.utils.vboxVMStates.isOneRecord(['Running'],[vcube.widget.PreviewMonitor.vmrecord]))) {
				vcube.widget.PreviewMonitor.previewTimer = window.setTimeout(vcube.widget.PreviewMonitor.loadVMImage, vcube.widget.PreviewMonitor.previewUpdateInterval * 1000);
			}
		},
	

		/*
		 * Load machine image
		 * 
		 */
		loadVMImage: function() {
			
			vcube.widget.PreviewMonitor.targetDiv.style.cursor = 'pointer';
			
			// Running VMs get random numbers.
			// Saved are based on last state change to try to let the browser cache Saved screen shots
			var randid = vcube.widget.PreviewMonitor.vmrecord.get('lastStateChange');
			if(vcube.utils.vboxVMStates.isRunning(vcube.widget.PreviewMonitor.vmrecord.getData())) {
				
				var currentTime = new Date();
				randid = Math.floor(currentTime.getTime() / 1000);
				
			}
			
			
			vcube.widget.PreviewMonitor.previewImg.src = 'vbox/machineGetScreenShot?' + Ext.urlEncode(Ext.apply({
				'width': vcube.widget.PreviewMonitor.previewWidth,
				'randid': randid,
			}, vcube.utils.vmAjaxParams(vcube.widget.PreviewMonitor.vmrecord.getData())));
			
			
		},
		
		/*
		 * Test to determine if browser supports canvas element
		 */
		_isCanvasSupported: null,
		isCanvasSupported : function() {
			
			if(vcube.widget.PreviewMonitor._isCanvasSupported === null) {
				try {
					var elem = document.createElement('canvas');			
					vcube.widget.PreviewMonitor._isCanvasSupported = !!(elem && elem.getContext && elem.getContext('2d'));
					elem = null;
				} catch (err) {
					vcube.widget.PreviewMonitor._isCanvasSupported = false;
				}
				
			}
			return vcube.widget.PreviewMonitor._isCanvasSupported;
		},
		
		/* Cache canvas images */
		canvasCache : {},
		
		/* Draw preview to div */
		drawPreview: function(imageObj, width, height, isDefaultImg) {
			
			if(vcube.widget.PreviewMonitor.isCanvasSupported()) {
				
				vcube.widget.PreviewMonitor.targetDiv.innerHTML = '';
				elem = document.createElement('canvas');
				vcube.widget.PreviewMonitor.targetDiv.appendChild(elem);
				canvas = vcube.widget.PreviewMonitor.targetDiv.childNodes[0];
				
				vcube.widget.PreviewMonitor.drawPreviewCanvas(canvas, imageObj, width, height, isDefaultImg);
				
			}
		},
		
		/* Draw a canvas preview image */
		drawPreviewCanvas : function(can, imageObj, width, height, isDefaultImg) {
			
			var screenMargin = 7;
			var margin = 10;
			
			var resizeToImage = !isDefaultImg && (imageObj && (imageObj.width == width));
			
			// Height / width comes from direct image values
			if(imageObj && resizeToImage) {
				
				height = imageObj.height;
				width = imageObj.width;
				
			// Set height while maintaining aspect ratio
			} else if (imageObj && !isDefaultImg) {
				
				height = imageObj.height * (width/imageObj.width);
			}
			
			// Margins are added to width
			height += ((margin+screenMargin)*2);
			width += ((margin+screenMargin)*2);
			
			// Does canvas still exist?
			// VM selection can change while this function is running
			// in which case the canvas goes away
			if(!can) return;
			
			// Set canvas values
			can.height = height;
			can.width = width;

			var ctx = can.getContext('2d');

			
			// Clear the canvas
			ctx.clearRect(0,0,width,height);
			
			ctx.save();
			
			// Draw and cache monitor image if it is not present
			if(!vcube.widget.PreviewMonitor.canvasCache[width+'x'+height]) {
				
				var cachedCanvas = document.createElement('canvas');
				
				cachedCanvas.width = width;
				cachedCanvas.height = height;
				
				var cachedCtx = cachedCanvas.getContext('2d');
				
				cachedCtx.beginPath();
				cachedCtx.strokeStyle = "#000000";
				cachedCtx.lineWidth = 0.3;
				cachedCtx.lineCap = 'butt';
				
				cachedCtx.moveTo(margin*2,margin);
				
				// top and top right
				cachedCtx.lineTo(width-(margin*2), margin);
				cachedCtx.arcTo(width-margin, margin, width-margin,margin*2, margin);
				
				// Side and bottom right
				cachedCtx.lineTo(width-margin, height-(margin*2));
				cachedCtx.arcTo(width-margin, height-margin, width-(margin*2), height-margin, margin);
				
				// bottom and bottom left
				cachedCtx.lineTo(margin*2, height-margin);
				cachedCtx.arcTo(margin, height-margin, margin, height-(margin*2), margin);
				
				// Left line and top left
				cachedCtx.lineTo(margin, margin*2);
				cachedCtx.arcTo(margin, margin, margin * 2, margin, margin);
					
				cachedCtx.closePath();
				cachedCtx.save();
				cachedCtx.shadowOffsetX = 5;
				cachedCtx.shadowOffsetY = 5;
				cachedCtx.shadowBlur = 4;
				cachedCtx.shadowColor = "rgba(30, 30, 30, 0.2)";            
				
				
				
				
				var grad = cachedCtx.createLinearGradient(0, margin, 0, height);
				grad.addColorStop(0, "rgb(200,200,200)");
				grad.addColorStop(0.4, "rgb(100,100,100)");
				grad.addColorStop(0.5, "rgb(66,66,66)");
				grad.addColorStop(0.7, "rgb(100,100,100)");
				grad.addColorStop(1, "rgb(200,200,200)");
				
				cachedCtx.fillStyle = grad;
				
				cachedCtx.fill();
				
				// Redraw so that shadow is seen on all sides
				cachedCtx.shadowOffsetX = -5;
				cachedCtx.shadowOffsetY = -5;
				cachedCtx.fill();
				cachedCtx.restore();
				cachedCtx.fillRect(margin+screenMargin,margin+screenMargin,width-(margin*2)-(screenMargin*2),height-(margin*2)-(screenMargin*2));             
				cachedCtx.stroke();
				cachedCtx.restore();
				
				var cvs = document.createElement('canvas');

				/* Gloss */
				var rectX = 0;
				var rectY = 0;
				var rectWidth = width-(margin+screenMargin)*2;
				var rectHeight = height-(margin+screenMargin)*2;
				
				cvs.width = rectWidth;
				cvs.height = rectHeight;
				
				var ctxBlur = cvs.getContext('2d');
				ctxBlur.beginPath();
				ctxBlur.lineWidth = 1;
				ctxBlur.strokeStyle = "#000000";
				ctxBlur.moveTo(rectX,rectY);
				ctxBlur.lineTo(rectWidth, rectY);
				ctxBlur.lineTo(rectWidth,rectHeight*1.0/3.0);
				ctxBlur.bezierCurveTo(rectX+rectWidth / 2.0, rectY + rectHeight * 1.0/3.0,
						rectX+rectWidth / 2.0, rectY + rectHeight * 2.0/3.0,
						rectX, rectY + rectHeight * 2.0/3.0);
				ctxBlur.closePath();
				ctxBlur.fillStyle="rgba(255,255,255,0.3)";
				ctxBlur.fill();
				
				vcube.widget.PreviewMonitor._stackBlurCanvasRGBA( cvs, 0, 0, rectWidth, rectHeight, 17 );
				
				ctx.drawImage(cvs, margin+screenMargin, margin+screenMargin, rectWidth, rectHeight);

				vcube.widget.PreviewMonitor.canvasCache[width+'x'+height] = {
						'monitor' : cachedCanvas,
						'gloss' : cvs
				};
				
			}

			// Draw cached monitor canvas
			ctx.drawImage(vcube.widget.PreviewMonitor.canvasCache[width+'x'+height]['monitor'], 0, 0, width, height);

			/* Screenshot */
			if(imageObj) {
				
				if(!isDefaultImg) {
					ctx.drawImage(imageObj, 0, 0, imageObj.width, imageObj.height, (margin+screenMargin), (margin+screenMargin), width-(margin*2)-(screenMargin*2),height-(margin*2)-(screenMargin*2));
				} else {
					// assumes a square image
					var imgSize = (vcube.widget.PreviewMonitor.defaultImageSize ? vcube.widget.PreviewMonitor.defaultImageSize : imageObj.width);
					ctx.drawImage(imageObj, (width / 2) - (imgSize / 2), (height / 2) - (imgSize / 2), imgSize, imgSize);
				}
			}

			// Draw cached gloss canvas
			ctx.drawImage(vcube.widget.PreviewMonitor.canvasCache[width+'x'+height]['gloss'], 0, 0, width, height);
			
		},
		
		/* HELPERS */

		/*

		StackBlur - a fast almost Gaussian Blur For Canvas

		Version: 	0.5
		Author:		Mario Klingemann
		Contact: 	mario@quasimondo.com
		Website:	http://www.quasimondo.com/StackBlurForCanvas
		Twitter:	@quasimondo

		In case you find this class useful - especially in commercial projects -
		I am not totally unhappy for a small donation to my PayPal account
		mario@quasimondo.de

		Or support me on flattr: 
		https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

		Copyright (c) 2010 Mario Klingemann

		Permission is hereby granted, free of charge, to any person
		obtaining a copy of this software and associated documentation
		files (the "Software"), to deal in the Software without
		restriction, including without limitation the rights to use,
		copy, modify, merge, publish, distribute, sublicense, and/or sell
		copies of the Software, and to permit persons to whom the
		Software is furnished to do so, subject to the following
		conditions:

		The above copyright notice and this permission notice shall be
		included in all copies or substantial portions of the Software.

		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
		EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
		OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
		NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
		HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
		WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
		FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
		OTHER DEALINGS IN THE SOFTWARE.
		*/


		/* Gloss helpers */
		_gloss_mul_table : [
		                 512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
		                 454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
		                 482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
		                 437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
		                 497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
		                 320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
		                 446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
		                 329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
		                 505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
		                 399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
		                 324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
		                 268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
		                 451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
		                 385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
		                 332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
		                 289,287,285,282,280,278,275,273,271,269,267,265,263,261,259],
		                 
		            
		_gloss_shg_table : [
		         	     9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 
		         		17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 
		         		19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
		         		20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
		         		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
		         		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 
		         		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
		         		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 
		         		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		         		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		         		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 
		         		23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 
		         		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		         		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		         		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		         		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ],

		         		
	    _stackBlurCanvasRGBA : function( canvas, top_x, top_y, width, height, radius ) {
	    	
	    	var BlurStack = function()
	    	{
	    		this.r = 0;
	    		this.g = 0;
	    		this.b = 0;
	    		this.a = 0;
	    		this.next = null;
	    	};

			if ( isNaN(radius) || radius < 1 ) return;
			radius |= 0;
			
			//var canvas  = document.getElementById( id );
			var context = canvas.getContext("2d");
			var imageData;
			
			try {
			  try {
				imageData = context.getImageData( top_x, top_y, width, height );
			  } catch(e) {
			  
				// NOTE: this part is supposedly only needed if you want to work with local files
				// so it might be okay to remove the whole try/catch block and just use
				// imageData = context.getImageData( top_x, top_y, width, height );
				try {
					netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
					imageData = context.getImageData( top_x, top_y, width, height );
				} catch(e) {
					alert("Cannot access local image");
					throw new Error("unable to access local image data: " + e);
					return;
				}
			  }
			} catch(e) {
			  alert("Cannot access image");
			  throw new Error("unable to access image data: " + e);
			}
					
			var pixels = imageData.data;
					
			var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum, 
			r_out_sum, g_out_sum, b_out_sum, a_out_sum,
			r_in_sum, g_in_sum, b_in_sum, a_in_sum, 
			pr, pg, pb, pa, rbs;
					
			var div = radius + radius + 1;
			var widthMinus1  = width - 1;
			var heightMinus1 = height - 1;
			var radiusPlus1  = radius + 1;
			var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;
			
			var stackStart = new BlurStack();
			var stack = stackStart;
			for ( i = 1; i < div; i++ )
			{
				stack = stack.next = new BlurStack();
				if ( i == radiusPlus1 ) var stackEnd = stack;
			}
			stack.next = stackStart;
			var stackIn = null;
			var stackOut = null;
			
			yw = yi = 0;
			
			var mul_sum = vcube.widget.PreviewMonitor._gloss_mul_table[radius];
			var shg_sum = vcube.widget.PreviewMonitor._gloss_shg_table[radius];
			
			for ( y = 0; y < height; y++ )
			{
				r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;
				
				r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
				g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
				b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
				a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );
				
				r_sum += sumFactor * pr;
				g_sum += sumFactor * pg;
				b_sum += sumFactor * pb;
				a_sum += sumFactor * pa;
				
				stack = stackStart;
				
				for( i = 0; i < radiusPlus1; i++ )
				{
					stack.r = pr;
					stack.g = pg;
					stack.b = pb;
					stack.a = pa;
					stack = stack.next;
				}
				
				for( i = 1; i < radiusPlus1; i++ )
				{
					p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
					r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
					g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
					b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
					a_sum += ( stack.a = ( pa = pixels[p+3])) * rbs;
					
					r_in_sum += pr;
					g_in_sum += pg;
					b_in_sum += pb;
					a_in_sum += pa;
					
					stack = stack.next;
				}
				
				
				stackIn = stackStart;
				stackOut = stackEnd;
				for ( x = 0; x < width; x++ )
				{
					pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
					if ( pa != 0 )
					{
						pa = 255 / pa;
						pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
						pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
						pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
					} else {
						pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
					}
					
					r_sum -= r_out_sum;
					g_sum -= g_out_sum;
					b_sum -= b_out_sum;
					a_sum -= a_out_sum;
					
					r_out_sum -= stackIn.r;
					g_out_sum -= stackIn.g;
					b_out_sum -= stackIn.b;
					a_out_sum -= stackIn.a;
					
					p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;
					
					r_in_sum += ( stackIn.r = pixels[p]);
					g_in_sum += ( stackIn.g = pixels[p+1]);
					b_in_sum += ( stackIn.b = pixels[p+2]);
					a_in_sum += ( stackIn.a = pixels[p+3]);
					
					r_sum += r_in_sum;
					g_sum += g_in_sum;
					b_sum += b_in_sum;
					a_sum += a_in_sum;
					
					stackIn = stackIn.next;
					
					r_out_sum += ( pr = stackOut.r );
					g_out_sum += ( pg = stackOut.g );
					b_out_sum += ( pb = stackOut.b );
					a_out_sum += ( pa = stackOut.a );
					
					r_in_sum -= pr;
					g_in_sum -= pg;
					b_in_sum -= pb;
					a_in_sum -= pa;
					
					stackOut = stackOut.next;

					yi += 4;
				}
				yw += width;
			}

			
			for ( x = 0; x < width; x++ )
			{
				g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;
				
				yi = x << 2;
				r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
				g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
				b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
				a_out_sum = radiusPlus1 * ( pa = pixels[yi+3]);
				
				r_sum += sumFactor * pr;
				g_sum += sumFactor * pg;
				b_sum += sumFactor * pb;
				a_sum += sumFactor * pa;
				
				stack = stackStart;
				
				for( i = 0; i < radiusPlus1; i++ )
				{
					stack.r = pr;
					stack.g = pg;
					stack.b = pb;
					stack.a = pa;
					stack = stack.next;
				}
				
				yp = width;
				
				for( i = 1; i <= radius; i++ )
				{
					yi = ( yp + x ) << 2;
					
					r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
					g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
					b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
					a_sum += ( stack.a = ( pa = pixels[yi+3])) * rbs;
				   
					r_in_sum += pr;
					g_in_sum += pg;
					b_in_sum += pb;
					a_in_sum += pa;
					
					stack = stack.next;
				
					if( i < heightMinus1 )
					{
						yp += width;
					}
				}
				
				yi = x;
				stackIn = stackStart;
				stackOut = stackEnd;
				for ( y = 0; y < height; y++ )
				{
					p = yi << 2;
					pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
					if ( pa > 0 )
					{
						pa = 255 / pa;
						pixels[p]   = ((r_sum * mul_sum) >> shg_sum ) * pa;
						pixels[p+1] = ((g_sum * mul_sum) >> shg_sum ) * pa;
						pixels[p+2] = ((b_sum * mul_sum) >> shg_sum ) * pa;
					} else {
						pixels[p] = pixels[p+1] = pixels[p+2] = 0;
					}
					
					r_sum -= r_out_sum;
					g_sum -= g_out_sum;
					b_sum -= b_out_sum;
					a_sum -= a_out_sum;
				   
					r_out_sum -= stackIn.r;
					g_out_sum -= stackIn.g;
					b_out_sum -= stackIn.b;
					a_out_sum -= stackIn.a;
					
					p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;
					
					r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
					g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
					b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
					a_sum += ( a_in_sum += ( stackIn.a = pixels[p+3]));
				   
					stackIn = stackIn.next;
					
					r_out_sum += ( pr = stackOut.r );
					g_out_sum += ( pg = stackOut.g );
					b_out_sum += ( pb = stackOut.b );
					a_out_sum += ( pa = stackOut.a );
					
					r_in_sum -= pr;
					g_in_sum -= pg;
					b_in_sum -= pb;
					a_in_sum -= pa;
					
					stackOut = stackOut.next;
					
					yi += width;
				}
			}
			
			context.putImageData( imageData, top_x, top_y );
			
		}
	
	}
});