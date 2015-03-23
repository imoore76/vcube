Ext.define('vcube.form.field.slider', {
    extend: 'Ext.form.FieldContainer',
    mixins: {
        field: 'Ext.form.field.Field'
    },
    alias: 'widget.vcubesliderfield',
    layout: 'hbox',
    combineErrors: true,
    msgTarget: 'side',
    submitFormat: 'c',
    
    minValue: 2,
    maxValue: 50,
    valueLabel: 'GB',
    valueLabelFn: null,
    
    slider: null,
    spinner: null,
    valueBox: null,
    
    // Use bytes values
    mbytesValue: false,
    
    hideValueBox: false,
    
    sliderTickTpl: new Ext.XTemplate('<div style="font-size: 7px; width: 100%;padding-left: 6px; padding-right: 6px;overflow: hidden;">'+
    		'<div id="slider-ticks-{sliderTplId}" class="sliderTicks" />'+
		'</div><div style="width: 100%; font-size: 11px; height: 14px;">'+
		'<span style="float: left;" id="slider-min-label-{sliderTplId}">{minLabel}</span>'+
		'<span style="float: right" id="slider-max-label-{sliderTplId}">{maxLabel}</span>'+
		'</div>'),
    
    items: [],
    
    reconfigure: function(min,max,label) {
    
    	this.setMaxValue(max);
    	this.setMinValue(min);
    	this.valueLabel = label;
    	
    	this.valueBox.update(valueLabel);
    	
    	
    },
    
    getValueLabel: function(val) {
    	return (this.valueLabelFn ? this.valueLabelFn(val) : val + ' ' + this.valueLabel);
    },
    
    setMaxValue: function(val) {
    	
    	this.slider.setMaxValue(vcube.utils.toInt(val));
    	this.spinner.setMaxValue(vcube.utils.toInt(val));
    	
    	// Slider subtpl will have to be redrawn and ticks applied again
    	Ext.getEl('slider-max-label-'+sliderTplId).update(this.getValueLabel(val));
    	this.applyTicks(this.slider);
    	
    },
    
    setMinValue: function(val) {
    	
    	this.slider.setMinValue(vcube.utils.toInt(val));
    	this.spinner.setMinValue(vcube.utils.toInt(val));
    	
    	// Slider subtpl will have to be redrawn and ticks applied again
    	Ext.getEl('slider-min-label-'+sliderTplId).update(this.getValueLabel(val));
    	this.applyTicks(this.slider);
    },
    
    getSubmitValue: function() {
    	return this.getValue();
    },
    
    getValue: function() {
    	return this.slider.getValue();
    },
    
    setValue: function(val) {
    	this.slider.setValue(vcube.utils.toInt(val));
    	this.spinner.setValue(vcube.utils.toInt(val));
    },
    
    /* Apply ticks to slider element */
    applyTicks: function(slider) {
    	
    	// Not rendered yet?
    	var tickEl = Ext.get('slider-ticks-'+this.sliderTplId);
    	if(!tickEl || !slider.innerEl) return;
    	
    	// clear content
    	tickEl.update('');

    	// set width
    	var swidth = slider.innerEl.getWidth();
    	if(!swidth) {
    		// if no width has been set, there is nothing to do
    		return;
    	}
    	tickEl.setWidth(swidth+1);

    	// Initial ratio
		var ratio = slider.getRatio();
		var range = slider.getRange();
		
		
		// Alter ratio so that we have at least 10px between lines
		while(ratio < 10) {
			ratio *= 2;
			range = range / 2;
		}
		
		for(var i = 1; i < range; i++) {	
			var innerEl = new Ext.Element(document.createElement('div'));
			innerEl.setStyle('left', ((ratio*i)-1) + 'px');
			tickEl.appendChild(innerEl);
		}

    },
    
    initComponent: function(options) {
    	
    	Ext.apply(this, options);
    	
    	this.sliderTplId = 'slider-ticks-' + Ext.id();
    	
    	// Bytes values 
    	if(this.mbytesValue) {
    		this.valueLabelFn = vcube.utils.mbytesConvert;
    		this.valueLabelConvertFn = vcube.utils.convertMBString;
    		this.hideValueBox = true;
    	}
    	
    	this.items = [{
    		xtype: 'slider',
    		flex: 1,
    		submitValue: false,
    		maxValue: this.maxValue,
    		minValue: this.minValue,
    		value: this.value,
    		afterSubTpl: this.sliderTickTpl.apply({
    			minLabel: this.getValueLabel(this.minValue),
    			maxLabel: this.getValueLabel(this.maxValue),
    			sliderTplId: this.sliderTplId
    		}),
    		listeners: {
    			changecomplete: function(slider, newValue) {
    				slider.ownerCt.items.items[1].setValue(newValue);    			
    			},
    			resize: function(slider, width) {
    				this.applyTicks(slider);
    			},
    			scope: this
    		}
    	},{
    		xtype: 'spinnerfield',
    		inputWidth: (this.valueLabelFn ? 80 : 60),
    		maxValue: this.maxValue,
    		minValue: this.minValue,
    		submitValue: false,
    		margin: '0 0 0 8',
    		value: this.value,
    		internalValue: this.value,
    		listeners: {
    			spin: function(spinner, dir) {
    				
    				var val = spinner.getValue();
    				
    				if(this.mbytesValue) {
    					console.log("Old val: " + val);
    					val = vcube.utils.convertMBString(parseFloat(vcube.utils.toFloat(val)) + (dir == 'up' ? 1 : -1) +
    							' ' + (val.split(' ')[1] || 'MB'));
    					
    					console.log("New val: " + val);
    				} else {
    					val = vcube.utils.toInt(val) + (dir == 'up' ? 1 : -1);
    				}
    				
    				// Respect min / max values
    				val = Math.max(Math.min(val, spinner.maxValue), spinner.minValue);
    				    				
    				spinner.setValue(val);
    				spinner.ownerCt.items.items[0].setValue(val);
    			},
    			blur: function(spinner) {

    				var val = vcube.utils.toInt(spinner.getValue());
    				
    				// Respect min / max values
    				val = Math.max(Math.min(val, spinner.maxValue), spinner.minValue);
    				
    				spinner.setValue(val);
    				spinner.ownerCt.items.items[0].setValue(val);
    			},
    			scope: this
    		}
    	},{
    		html: this.valueLabel,
    		bodyStyle: { background: 'transparent' },
    		border: false,
    		width: 40,
    		margin: '6 0 0 6',
    		hidden: this.hideValueBox,
    		textAlign: 'left'
    	}];
    	
	    
	    this.callParent(arguments);

	    this.slider = this.down('slider');
	    this.spinner = this.down('spinnerfield');
	    this.valueBox = this.items.items[2];

    }
});