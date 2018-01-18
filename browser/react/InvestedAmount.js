import React from 'react';
import { Link } from 'react-router-dom';


class InvestedAmount extends React.Component{
	constructor( props ){
		super( props );

		this.state = {
			investedAmount: 1000000
		
		}
		this.onMoneyChange = this.onMoneyChange.bind(this);
		this.onGenerate = this.onGenerate.bind(this);
		this.addCommas = this.addCommas.bind(this);
	}

	onMoneyChange(ev){
		let investedAmount = ev.target.value;
		this.setState({ investedAmount });
	}
	
	onGenerate(ev){
		ev.preventDefault();
		this.props.generateLadder(this.state.investedAmount);

		const investedAmount = this.state.investedAmount;
		this.setState({ investedAmount });
//		const investedAmount = this.addCommas(this.state.investedAmount);
//		this.setState({ investedAmount })
	}

	addCommas(intNum){
		return (intNum + '').replace(/(\d)(?=(\d{3})+$)/g,'$1,');
	}

	render(){
		return (
			<form>
			  <div className="form-group">
				<label>Invested</label><div><label>Amount</label></div>
				<input className="form-control" value={ this.state.investedAmount } onChange = { this.onMoneyChange }></input>
			  </div>
			<button className="btn btn-default" onClick = { this.onGenerate }>Generate Ladder</button>
   		  </form>



	   )
	}
}

export default InvestedAmount;
