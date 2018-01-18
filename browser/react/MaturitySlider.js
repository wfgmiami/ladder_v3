import React from 'react';


class MaturitySlider extends React.Component{
	constructor(){
		super();
		this.state = {
			min: 1,
			max: 5,
		}

	}

	onMaturity(){
		const filter = { min: this.state.min, max: this.state.max };
		this.props.filterMaturity( filter );
	}

	sliderChange(e){

		const value = e.target.value * 1;

		if( this.inputMin === e.target ){
			if( value > this.state.max ){
			}else{
				this.setState({ min: value }, () => this.onMaturity())
			}

		}else if( this.inputMax === e.target ){
			if( value < this.state.min ){
			}else{
				this.setState({ max: value }, () => this.onMaturity())
			}
		}


		// console.log('e.target.......', this.state,e.target)
	}

	render(){

		return(
			<div>
					<div style={{ float:'left' }} >
						<p><b>Minimum Maturity</b></p>
						<span className="range-slider__value">{ this.state.min } </span>
					</div>

					<div className="range-slider-double">
						<div> &nbsp;</div><div>&nbsp;</div>
						<input onInput={ (e) => this.sliderChange(e) } ref = { input => this.inputMin = input } className="range-slider-double__range" type="range" value={ this.state.min }  min="1" max="30" step="1"/>

						<input onInput={ (e) => this.sliderChange(e) } ref = { input => this.inputMax = input } className="range-slider-double__range" type="range" value={ this.state.max }  min="1" max="30" step="1"/>
						<div>&nbsp;</div>
					</div>

					<div style={{ marginLeft: '10px', float:'left' }}>
						<p><b>Maximum Maturity</b></p>
						<span className="range-slider-max__value">{ this.state.max } </span>
						<div>&nbsp;</div>
					</div>


			</div>
		)
	}

}

export default MaturitySlider;
