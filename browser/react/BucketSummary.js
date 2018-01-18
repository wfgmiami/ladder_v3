import React from 'react';
import ReactDataGrid  from 'react-data-grid';

class BucketSummary extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			bucketsSummary: []
		}

		this._columns = [
			{ key: 'portfolioSummary', name: 'Portfolio Summary', resizable: true },
			{ key: 'dollarAllocated', name: 'Dollar Allocation', resizable: true },
			{ key: 'percentageAllocated', name: 'Percentage Allocated', resizable: true },
			{ key: 'rule', name: 'Rule', resizable: true },
		]
		this.rowGetter = this.rowGetter.bind(this);
	}

	componentWillMount(){
		console.log('.....willMount this.props', this.props);
		this.setState({ bucketsSummary: this.props.bucketsSummary });
	}

	componentWillReceiveProps( nextProps ){
		console.log('bucket allocation...next Props', nextProps);
		if( nextProps.bucketsSummary !== this.state.bucketsSummary ){
			this.setState( { bucketsSummary: nextProps.bucketsSummary } );
		}
	}

	rowGetter( i ){
		return this.state.bucketsSummary[i];
	}

	render(){

		const total = this.state.bucketsSummary.length;
		const headerText = "ALLOCATION SUMMARY";
	//	console.log('.....muni list', this.state.munis);
		return (
			<div className="panel panel-default"><div style = {{ textAlign: 'center' }}><b>{ headerText }</b></div>
			<div>&nbsp;&nbsp;</div>
			<ReactDataGrid
				columns={ this._columns }
				rowGetter = { this.rowGetter }
				rowsCount = { total }
				minHeight = { 450 }
				/>
			</div>
		);

	}
}


export default BucketSummary;

/*
import React from 'react';

class BucketSummary extends React.Component{
	constructor(props){
		super(props);
	}

	render(){
	console.log('bucket summary this.props.......',this.props);
	const sectors = Object.keys(this.props.allocSector);
	const aAndBelow = this.props.allocRating.aAndBelow;
	const aAndLow = 'A rated & below';
		return(
			<div>
			  <table>
				<thead>
					<tr>
						<th className="size">Portfolio Summary</th>
						<th className="size">Rule</th>	
						
					</tr>
				</thead>
			  </table>
			
			  <div style={{ maxHeight:'60vh', overflowY:'auto' }}>
			
			  <table>
				<tbody>
					<tr><td>{ aAndLow }, ${ aAndBelow.toLocaleString() }, { (aAndBelow/this.props.investedAmt*100).toFixed(2)*1 }%</td><td>{'<= 30%'}</td></tr>

					{ sectors.map( ( sector, id )  => (
						<tr key = { id }>
							<td>{ sector }, ${ this.props.allocSector[sector].toLocaleString()}, { (this.props.allocSector[sector]/this.props.investedAmt*100).toFixed(2)*1 }%</td>
							<td>{ sector == 'Health Care' ? '<= 12%' : '<= 20%' }</td>
						</tr>	
					))}
			   </tbody>
			  </table>
			
			  </div>

	  		</div>
		)
	}
}

export default BucketSummary;

*/
