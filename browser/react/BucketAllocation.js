import React from 'react';
import ReactDataGrid from 'react-data-grid';

class BucketAllocation extends React.Component{
	constructor(props){
		super(props);

		this.state = {
			columns: [],
			bucketsByRows: []
		}
		this.rowGetter = this.rowGetter.bind(this);
	  // this.rowStyle = this.rowStyle.bind(this);
	}

	componentWillMount(){
		this.setState({ columns: this.props.columns });
		this.setState({ bucketsByRows: this.props.bucketsByRows });
	}

	componentWillReceiveProps( nextProps ){
		console.log('bucket allocation...next Props', nextProps);
		if( nextProps.bucketsByRows !== this.state.bucketsByRows ){
			this.setState( { bucketsByRows: nextProps.bucketsByRows } );
			this.setState( { columns: nextProps.columns } );
		}
	}

	rowGetter( i ){
//		console.log('row function.....', this.state.bucketsByRows[i],i, this.state.bucketsByRows);
		return this.state.bucketsByRows[i];
	}


	render(){
  		const total = this.state.bucketsByRows.length;
		const headerText = "BUCKETS ALLOCATION";
console.log('....buckets allocation render this.state.bucketsByRows',this.state.props, this.state.bucketsByRows);
		return (
			<div className="panel panel-default"><div style={{ textAlign: 'center' }}><b>{ headerText }</b></div>
			<div>&nbsp;&nbsp;</div>
			<ReactDataGrid
				columns = { this.state.columns }
				rowGetter = { this.rowGetter }
				rowsCount = { total }
				minHeight = { 450 }
				minColumnWidth = { 150 }

				/>
			</div>
		);

	}

}

export default BucketAllocation;

/*
class BucketAllocation extends React.Component{
	constructor(props){
		super(props);
		this.state = {
			allocation: []
		}
	}

	render(){
		let lenBucket = [];
		let maxLen = 0;
		let totalByBucket = 0;
		let totalInBucket = [];
		let totalLines = [];
		let keyIdx = 0;

		const buckets = Object.keys(this.props.allocatedData);
		buckets.forEach( bucket => {
			for(let i = 0; i < buckets.length; i++){
				lenBucket.push(this.props.allocatedData[bucket].length);
			}

			for(let j = 0; j < this.props.allocatedData[bucket].length; j++){
				totalByBucket += this.props.allocatedData[bucket][j].investAmt;
//				console.log(this.props.allocatedData[bucket][j].investAmt)
			}
			totalLines.push(<td key = { keyIdx++ }>{ totalByBucket.toLocaleString() }</td>)
			totalByBucket = 0;
		})

		totalInBucket.push(<tr key={ keyIdx++ }> { totalLines }</tr>);
		maxLen = Math.max(...lenBucket);

		let tblData = [];
		let rowLines = [];
		let dataLine;
		const tblName = "BUCKETS ALLOCATION";

		for(let row = 0; row < maxLen; row++){
			//	tblData.push('<tr>');

				buckets.forEach( ( bucket, id ) => {
					dataLine = this.props.allocatedData[bucket][row];
					if( dataLine ){
						if( dataLine.cusip != 'Cash' ){
							rowLines.push(<td key = { keyIdx++ }>{ dataLine.cusip }, {dataLine.coupon}%, {dataLine.ytm}yr
								<tr>{ dataLine.sector }, {''} { dataLine.rating }</tr>
								<tr>${ dataLine.investAmt.toLocaleString() }</tr>
								</td>)
			   			}else{
							rowLines.push(<td key = { keyIdx++ }>{ dataLine.cusip }
								<tr>${ dataLine.investAmt.toLocaleString() }</tr>
								</td>)
						}

					}else{
						rowLines.push(<td key = { keyIdx++ }>{ '' }</td>)
					}
				})

				tblData.push(<tr key={ keyIdx++ }>{ rowLines }</tr>);
				rowLines = [];
		}

		console.log('props in bucket allocation', totalInBucket, tblData, maxLen, buckets,this.props);
		return(
		<div>
		  <table style={{ width:"100%" }}>
 			<thead>
				<tr><td colSpan={ buckets.length } style={{ textAlign: 'center', color: 'yellow' }}>{ tblName }</td></tr>
				<tr>
				{ buckets.map( (bucket, id) => (
					<th key={ keyIdx++ } className='size' style={{ textAlign: 'center' }}>{ bucket }</th>
				))}
				</tr>
			</thead>
		  </table>
		  <div style={{ maxHeight:'60vh', overflowY:'auto' }}>
		  <table>
			<tbody>
				{ tblData }
			</tbody>
			<tfoot>
				{ totalInBucket }
			</tfoot>
		  </table>
		  </div>
	  	</div>
	    )
	}
}

export default BucketAllocation;
*/
