import React from 'react';
import ReactDataGrid  from 'react-data-grid';

class PortfolioSummary extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			portfolioSummary: []
		}

		this._columns = [
			{ key: 'portfolioSize', name: 'Portfolio Size', resizable: true },
			{ key: 'numberOfBonds', name: 'Number Of Bonds', resizable: true },
			{ key: 'cash', name: 'Cash', resizable: true },
			{ key: 'effectiveDuration', name: 'Effective Duration', resizable: true },
			{ key: 'modifiedDuration', name: 'Modified Duration', resizable: true },
			{ key: 'yieldToWorst', name: 'Yield To Worst', resizable: true },
			{ key: 'avgPrice', name: 'Avg Price', resizable: true },
			{ key: 'avgCoupon', name: 'Avg Coupon', resizable: true },	
			{ key: 'tradeDateRange', name: 'Trade Date Range', resizable: true },	

		]
		this.rowGetter = this.rowGetter.bind(this);
	}

	componentWillMount(){
		console.log('.....portfolio summary willMount this.props', this.props);
		this.setState({ portfolioSummary: this.props.portfolioSummary });
	}

	componentWillReceiveProps( nextProps ){
		console.log(' portfolio summary...next Props', nextProps);
		if( nextProps.portfolioSummary !== this.state.portfolioSummary ){
			this.setState( { portfolioSummary: nextProps.portfolioSummary } );
		}
	}

	rowGetter( i ){
		return this.state.portfolioSummary[i];
	}

	render(){
		let total = 0;
		if( this.state.portfolioSummary.length )
 			total = 1;
	
		
		const headerText = "PORTFOLIO SUMMARY";
	//	console.log('.....muni list', this.state.munis);
		return (
			<div className="panel panel-default"><div style = {{ textAlign: 'center' }}><b>{ headerText }</b></div>
			<div>&nbsp;&nbsp;</div>
			<ReactDataGrid
				columns={ this._columns }
				rowGetter = { this.rowGetter }
				rowsCount = { total }
				minHeight = { 100 }
				/>
			</div>
		);

	}
}


export default PortfolioSummary;

