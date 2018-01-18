import React from 'react';

class Maturity extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			min:22,
			max:37
		}
		this.onMinChange = this.onMinChange.bind(this);
		this.onMaxChange = this.onMaxChange.bind(this);
		this.onMaturity = this.onMaturity.bind(this);
	}

	onMinChange(ev){
		this.setState( { min: ev.target.value * 1 } );
	}

	onMaxChange(ev){
		this.setState( { max: ev.target.value * 1 } );
	}

	onMaturity(ev){

		if( this.state.min > this.state.max){
			alert('Max maturity must be greater or equal to min maturity');
		}else{
			const filter = { min: this.state.min, max: this.state.max };
			ev.preventDefault();
		    this.props.filterMaturity( filter );

		}
		ev.preventDefault();
	}

	render(){

		let yearsRange = [];
		for(let i = 1; i < 31; i++){
			yearsRange.push(i);
		}

		return (
			<form>

			  <div className="col-sm-6">
			  <b>Min Maturity</b>
			  <select className="form-control" name="minMaturity" onChange = { this.onMinChange }>
				  { yearsRange.map( year => (
					<option key={ year } value={ year }>{ year } </option>
				  ))
				  }
			  </select>
			  </div>

			  <div className="col-sm-6">
			  <b>Max Maturity</b>
			  <select className="form-control" name="maxMaturity" onChange = { this.onMaxChange } >
				  { yearsRange.map( year => (
					<option key={ year*10 } value={ year }>{ year } </option>
				  ))
				  }
			  </select>
			  </div>
			  <div>&nbsp;</div>

			  <button className="btn btn-default" onClick={ this.onMaturity }>Filter Bonds</button>

			</form>
		)
	}
}
export default Maturity

