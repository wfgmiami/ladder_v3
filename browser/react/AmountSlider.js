import React from 'react';


class AmountSlider extends React.Component {
	constructor( props ){
		super( props );
		this.state = {
			investedAmount: 1000000
		}
		this.sliderChange = this.sliderChange.bind(this);
		this.onGenerate = this.onGenerate.bind(this);
	}

	onGenerate(ev){
		ev.preventDefault();
		this.props.setLadder(this.state.investedAmount);
	}

	sliderChange(e){
		const investedAmount = e.target.value;
		this.setState({ investedAmount })
//		console.log('this.......', this,e, e.target.value)
	}

	render(){
//		console.log('state......', this.state)
		return(

			<div>
				<div style={{ float:'left' }}>
					<p><b>Invested Amount</b></p>
					<span className="range-slider__value">${ Number(this.state.investedAmount).toLocaleString() }</span>
				</div>
				<div>&nbsp;</div>
				<div className="range-slider" >
					<div>&nbsp;</div>
					<input onInput={ (e) => this.sliderChange(e) } ref = { inputRange => this.inputRange = inputRange } className="range-slider__range" type="range" value={ this.state.investedAmount } min="250000" max="5000000" step="100000"/>
				</div>
				<div style={{ float: 'left' }}>
					<button style={{ marginTop: '5px', marginBottom:'5px', marginLeft:'10px' }} onClick={ this.onGenerate } className="btn btn-primary" type="submit">Create Ladder</button>
				</div>
				<br style={{ clear: 'both' }}/>
				<div>&nbsp;</div>
			</div>
		)

	}
}

export default AmountSlider;
