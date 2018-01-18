import React, { Component } from 'react';
import { connect } from 'react-redux';
import axios from 'axios';
import Nav from './Nav';
import MuniList from './MuniList';
import Maturity from './Maturity';
import Constraint from './Constraint';
import InvestedAmount from './InvestedAmount';
import BucketAllocation from './BucketAllocation';
import BucketSummary from './BucketSummary';
import muniList from '../../muniList.json';
import BucketSummaryPlaceholder from './BucketSummaryPlaceholder';
import css from '../../assets/stylesheets/style.scss';

const Promise = require('es6-promise-promise');

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
		munis:[],
		ytmLadder:[],
		rankedMuniList:[],
		allocatedData: [],
		allocSector: {},
		allocRating: {},
		investedAmount: 1000000,
		bucketsByRows: [],
		columns: [],
		portfolioSummary: []
	};

	this.filterMaturity = this.filterMaturity.bind(this);
	this.generateLadder = this.generateLadder.bind(this);
  	this.createRanking = this.createRanking.bind(this);
  	this.createRows = this.createRows.bind(this);
	this.createColumns = this.createColumns.bind(this);
	this.createSummary = this.createSummary.bind(this);
  }

  componentDidMount() {
		this.setState({ munis: muniList });
  }

	filterMaturity( filter ){
		let url = '/api/munis/filter';
		let ytmLadder = [];
		for(let i = filter.min; i <= filter.max; i++){
			ytmLadder.push(i);
		}
		this.setState({ ytmLadder });
		axios.get(url, { params: filter })
			.then( response => response.data )
			.then( munis => {
				this.setState( { munis } );
			})
			.then( () => this.createRanking() )
			.catch( err => console.log( err ) );
  }

  createRanking(){
		const ladderBuckets = this.state.ytmLadder;
		let rankedMunis = {};
		let aRatedPruned = {};
		let aaRatedPruned = {};
		let couponPruned = {};
		let tempObj = {};
		let rankedMuniList = [];

		ladderBuckets.forEach( bucket => {

			let selectedMunis = this.state.munis.filter( muni => muni.ytm == bucket );
			let healthCareMunis = selectedMunis.filter( muni => muni.sector == 'Health Care' );
			let aRated = selectedMunis.filter( muni => muni.rating == 'A' ).concat( selectedMunis.filter( muni => muni.rating == 'A+') )
						.concat( selectedMunis.filter( muni => muni.rating == 'A-' )).concat( selectedMunis.filter( muni => muni.rating.slice(0,2) == 'A/' ));
			let aaRated = selectedMunis.filter( muni => muni.rating.slice(0,2) == 'AA' );
			let couponRated = selectedMunis.sort( ( a,b ) => b.coupon - a.coupon );
			rankedMunis[bucket]=[{ 'HealthCare':healthCareMunis, 'aRated': aRated, 'aaRated': aaRated, 'couponRated': couponRated }];

		})

		ladderBuckets.forEach( bucket => {
				rankedMunis[bucket][0]['HealthCare'].forEach( hcMuni => tempObj[hcMuni.cusip] = hcMuni );
				aRatedPruned[bucket] = rankedMunis[bucket][0]['aRated'].filter( aRated => !(aRated.cusip in tempObj ));
				aaRatedPruned[bucket] = rankedMunis[bucket][0]['aaRated'].filter( aaRated => !(aaRated.cusip in tempObj ));
				couponPruned[bucket] = rankedMunis[bucket][0]['couponRated'].filter( couponMuni => !(couponMuni.cusip in tempObj ));

				tempObj = {};
				rankedMunis[bucket][0]['aRated'].forEach( aRated => tempObj[aRated.cusip] = aRated );
				couponPruned[bucket] = couponPruned[bucket].filter( couponMuni => !(couponMuni.cusip in tempObj ));

				tempObj = {};
				rankedMunis[bucket][0]['aaRated'].forEach( aaRated => tempObj[aaRated.cusip] = aaRated );
				couponPruned[bucket] = couponPruned[bucket].filter( couponMuni => !(couponMuni.cusip in tempObj ));
				rankedMuniList[bucket] = { 'HealthCare': rankedMunis[bucket][0]['HealthCare'], 'aRated': aRatedPruned[bucket], 'aaRated': aaRatedPruned[bucket], 'couponRated': couponPruned[bucket] };
				tempObj = {};
		})

		// console.log('........rankedMuniList', rankedMuniList);
		this.setState({ rankedMuniList });
  }

  generateLadder(investedAmount){

	const maxPercBond = 0.1;
	const minAllocBond = 25000;
	const maxAllocBond = 100000;
	const maxSector = 0.20;
	const maxHealthCare = 0.12;
	const maxRating = 0.30;
	const ranking = ['HealthCare', 'aRated', 'aaRated', 'couponRated'];
	const allocatedData = {};
	const muniData = this.state.rankedMuniList;
	const bucketMoney = Number(( investedAmount / numBuckets ).toFixed(0));
	const minAllocCheck = Number(( maxPercBond * investedAmount).toFixed(0));

	let bondIndex = 0;
  let numBuckets = 1;
	let allocSector =  {};
 	let allocRating = {};
	let allocBucket = {};
	let rankIndex = 0;
 	let oneBucketFlag = false;
	let buckets = [...this.state.ytmLadder];
	let cnt = 0;
	let appliedRank = ranking[rankIndex];
	let bucket = buckets[numBuckets-1];
	let allocCash = 0;
	let changedRule = false;
	let increaseAfterFirstDown = false;
	let increaseRankIndex = false;
	let chosenBond = [];
	let idx = 0;
	let appliedRanking = '';

	this.setState({ investedAmount });

	if( buckets.length !== 0 ) numBuckets = buckets.length;
	if( buckets.length === 1 ) oneBucketFlag = true;
	if( buckets.length === 0 ) {
		alert('Please select min and max maturity for the buckets!');
		return;
	}

	if( minAllocCheck < minAllocBond ) {
		alert(`${ maxPercBond * 100 } of the total invested amount is ${ minAllocCheck.toLocaleString() }. This is less that minimum of ${ minAllocBond.toLocaleString()} allocation`);
		return;
	}

	do{

		if( rankIndex < ranking.length ){
			chosenBond = muniData[bucket][appliedRank][bondIndex];
		}else{
			// no more bonds left for alloction in the bucket
			console.log('................rankIndex = ranking.length', rankIndex, ranking.length);
			if( !allocBucket[bucket] ){
				allocCash = bucketMoney;
			}else{
				allocCash = ( bucketMoney - ( allocBucket[bucket] -  minAllocBond ) );
			}
			chosenBond['cusip'] = 'Cash';
			chosenBond['investAmt'] = allocCash;

			if( allocatedData[bucket] ){
				allocatedData[bucket].push( chosenBond );
			}else{
				allocatedData[bucket] = [chosenBond];
			}

			idx = buckets.indexOf(bucket);
			buckets.splice(idx,1);
//				console.log('.....splicing ran out of bonds:bucket, idx, buckets---', bucket, idx, buckets);
			numBuckets = buckets.length;
			if( numBuckets !== 0 ){
				bucket--;
			}
			if( numBuckets === 0 ) break;
		}

		if( !chosenBond && rankIndex < ranking.length ){
  	  appliedRank = ranking[++rankIndex];
			increaseRankIndex = true;
			console.log('..............!chosenBond &&..rankIndex = ranking.length', muniData[bucket][appliedRank][bondIndex],chosenBond, rankIndex, ranking.length);
			while( !muniData[bucket][appliedRank][bondIndex] && rankIndex < ranking.length ){
				appliedRank = ranking[++rankIndex];
				console.log('..............hit increaseRankIndex', appliedRank, rankIndex);
//				increaseRankIndex = true;
			}

			if( rankIndex === ranking.length ){
				console.log('........rankIndex===ranking.length', rankIndex, ranking.length);
				if( !allocBucket[bucket] ){
					allocCash = bucketMoney;
				}else{
					allocCash = bucketMoney - allocBucket[bucket];
				}
				chosenBond['cusip'] = 'Cash';
				chosenBond['investAmt'] = allocCash;

				if( allocatedData[bucket] ){
					allocatedData[bucket].push( chosenBond );
				}else{
					allocatedData[bucket] = [chosenBond];
				}

				let idx = buckets.indexOf(bucket);
				buckets.splice(idx,1);
	//				console.log('splicing...money left', bucket, bucketMoney, idx, buckets);
				numBuckets = buckets.length;
				if( numBuckets != 0 ){
					bucket--;
				}
				if( numBuckets === 0 ) break;
			}else{
				chosenBond = muniData[bucket][appliedRank][bondIndex];
			}
		}

		let sector = chosenBond.sector;
		let rating = chosenBond.rating;
		console.log('muniData,chosen bond, bondIndex,bucket(s), appliedRank,sector,rating',muniData, chosenBond, bondIndex, bucket, buckets, appliedRank, sector, rating);
		if(	allocSector[sector] ){
			allocSector[sector] += minAllocBond;
		}else{
			allocSector[sector] = minAllocBond;
		}

		if( rating.slice(0,2) !== 'AA' ){
			if( allocRating['aAndBelow'] ){
				allocRating['aAndBelow'] += minAllocBond;
			}else{
				allocRating['aAndBelow'] = minAllocBond;
			}
		}

		if( allocBucket[bucket] ){
			allocBucket[bucket] += minAllocBond;
		}else{
			allocBucket[bucket] = minAllocBond;
		}

		if( sector == 'Health Care' && allocSector[sector] > maxHealthCare * investedAmount ){
			console.log('hit....', maxHealthCare, investedAmount);
			allocSector[sector] -= minAllocBond;
			allocBucket[bucket] -= minAllocBond;
			appliedRank = ranking[++rankIndex];
			changedRule = true;
		}else if( allocSector[sector] > maxSector * investedAmount ){
			allocSector[sector] -= minAllocBond;
			allocBucket[bucket] -= minAllocBond;
			if( ( muniData[bucket][appliedRank].length - 1) == bondIndex ){
				appliedRank = ranking[++rankIndex];
				bondIndex = 0;
				changedRule = true;
			}else{
				console.log('......hit sector', sector, maxSector*investedAmount);
				bondIndex++;
			}
		}else if( allocRating['aAndBelow'] > maxRating * investedAmount && rating.slice(0,2) !== 'AA' ){
			console.log('hit...aAndBewlow >....', maxRating, investedAmount, maxRating*investedAmount, allocRating['aAndBelow']);
			allocRating['aAndBelow'] -= minAllocBond;
			allocBucket[bucket] -= minAllocBond;
			appliedRank = ranking[++rankIndex];
			changedRule = true;
			bondIndex = 0;
		}else if( allocBucket[bucket] == bucketMoney ){
			chosenBond['investAmt'] = minAllocBond;

			if( allocatedData[bucket] ){
				allocatedData[bucket].push( chosenBond );
			}else{
				allocatedData[bucket] = [chosenBond];
			}

			let idx = buckets.indexOf(bucket);
			buckets.splice(idx,1);
			console.log('splicing...', bucket, bucketMoney, idx, buckets);
			numBuckets = buckets.length;
			if( numBuckets != 0 ){
				bucket--;
			}
		}else if( allocBucket[bucket] > bucketMoney ){

				allocCash = ( bucketMoney - ( allocBucket[bucket] -  minAllocBond ) );
				chosenBond['cusip'] = 'Cash';
				chosenBond['investAmt'] = allocCash;

				if( allocatedData[bucket] ){
					allocatedData[bucket].push( chosenBond );
				}else{
					allocatedData[bucket] = [chosenBond];
				}

				let idx = buckets.indexOf(bucket);
				buckets.splice(idx,1);
//				console.log('splicing...money left', bucket, bucketMoney, idx, buckets);
				numBuckets = buckets.length;
				if( numBuckets != 0 ){
					bucket--;
				}

		}else{
			chosenBond['investAmt'] = minAllocBond;
			if( allocatedData[bucket] ){
				allocatedData[bucket].push( chosenBond );
			}else{
				allocatedData[bucket] = [chosenBond];
			}

			if( (bucket - 1) < buckets[0] && numBuckets > 1){
//				console.log('first bucket', bucket, buckets[0]);
				bucket = buckets[numBuckets - 1];
				if( !changedRule ){
					bondIndex++;

				}else{
					changedRule = false;
					increaseAfterFirstDown = true;
				}

				if( increaseRankIndex ) {
					console.log('increaRankIndex', rankIndex)
					rankIndex--;
					increaseRankIndex = false;
				}

			}else if( numBuckets > 1 ){
//				console.log('bucket', bucket);
				bucket--;
				if(increaseAfterFirstDown){
					bondIndex++;
					increaseAfterFirstDown = false;
				}
				if( increaseRankIndex ) {
					console.log('increaRankIndex', rankIndex)
					rankIndex--;
					increaseRankIndex = false;
				}
			}else if( oneBucketFlag ){
				bondIndex++;
			}

//				console.log('bondIndex, bucket, changedRule', bondIndex, bucket, changedRule)
		}

//		cnt++
			//numBuckets > 0
	}while( numBuckets > 0 )

	const fields = Object.keys( allocRating );
	fields.forEach( field => {
		allocSector[field] = allocRating[field];
	})
	const portfolioSummary = this.createSummary( allocSector );
	const bucketsByRows = this.createRows( allocatedData );
	const columns = this.createColumns();
	//3/7 300k - good case
//	console.log('result...', allocatedData, allocSector, allocRating, allocBucket);
	this.setState({ columns });
	this.setState({ bucketsByRows });
	this.setState({ allocatedData });
	this.setState({ allocSector });
	this.setState({ allocRating });
	this.setState({ portfolioSummary });
  }

	createSummary( summary ){
		let fields = Object.keys( summary );
		let portfolioSummary = [];
		let rowObj = {};
		const columnFields = [ 'portfolioSummary', 'dollarAllocated', 'percentageAllocated', 'rule' ];

		console.log('.............summary', summary, this.state);
		fields.forEach( field => {
			rowObj[columnFields[0]] = field;
			rowObj[columnFields[1]] = '$' + ( summary[field] ).toLocaleString();
			rowObj[columnFields[2]] = Number( ( ( summary[field] * 1 / this.state.investedAmount *  1 ) * 100 ).toFixed(2) ) + '%';

			if( field === 'Health Care' ){
				rowObj[columnFields[3]] = '<= 12%';
			}else if( field === 'aAndBelow' ){
				rowObj[columnFields[3]] = '<= 30%';
			}else{
				rowObj[columnFields[3]] = '<= 20%';
			}
			portfolioSummary.push( rowObj );
			rowObj = {};
		})

		console.log('........portfolioSummary', portfolioSummary);
		return portfolioSummary;
	}

   	createColumns(){
		let columns = [];

		for( let i = 0; i < this.state.ytmLadder.length; i++ ){
			columns.push( { key: (this.state.ytmLadder[i]).toString(),
				name: ( this.state.ytmLadder[i] ), resizable: true } )
		}

		return columns;
	}

	createRows( objBuckets ){
		const buckets = Object.keys( objBuckets );
		const numBuckets = buckets.length;
		let lenBucket = [];
		let bucketsByRows = [];
		let maxBondsInBucket = 0;
		let rowsPerBond = 3;
		let bond = {};
		let row = {};
		let totalByBucket = {};
		let totalInBucket = 0;
		let bucketIndex = buckets[0];
		//console.log('.................', bucketIndex*1 + numBuckets);
		buckets.forEach( bucket => {
				for( let i = 0; i < numBuckets; i++ ){
					lenBucket.push( objBuckets[bucket].length );
				}

				for( let j = 0; j < objBuckets[bucket].length; j++ ){
					totalInBucket += objBuckets[bucket][j].investAmt;
				}
				totalByBucket[bucket] = '$' + totalInBucket.toLocaleString();
				totalInBucket = 0;
		})

		maxBondsInBucket = Math.max(...lenBucket);
		console.log('.....totalByBucket,maxBondInBucket, rowsPerBond, bucketIndex, numBuckets', totalByBucket,maxBondsInBucket, rowsPerBond, bucketIndex, numBuckets);
		for(let i = 0; i < maxBondsInBucket; i++){
			for(let j = 0; j < rowsPerBond; j++){
				for(let k = bucketIndex; k < numBuckets + bucketIndex*1; k++){

					bond = objBuckets[k][i];

					if( j === 0 ){
						if( bond.cusip === 'Cash' ){
							row[(k).toString()] = bond.cusip;
						}else{
							row[(k).toString()] = bond.cusip + ', ' + bond.coupon + '%, ' + bond.ytm + 'yr';
						}
					}else if( j === 1 ){
						if( bond.cusip === 'Cash' ){
							row[(k).toString()] = '$' + bond.investAmt.toLocaleString();

						}else{
							row[(k).toString()] = bond.sector + ', ' + bond.rating;
						}
					}else if( j === 2 && bond.cusip !== 'Cash' ){
						row[(k).toString()] = '$' + bond.investAmt.toLocaleString();
					}

				}
				if( Object.keys( row ).length !== 0 ){
					bucketsByRows.push( row );
					row = {};
				}
			}
		}
		bucketsByRows.push( totalByBucket );
		return bucketsByRows;
	}

   render() {
 	console.log('.....in App.js, this.state',this.state)
    const munis = [...this.state.munis];
    return (
      <div className="container-fluid">
        <Nav filterMaturity = { this.filterMaturity } generateLadder = { this.generateLadder }/>
          <div style={{ marginTop: '105px' }} className="row">

			{ this.state.bucketsByRows.length !== 0 ?
				<div className="col-sm-8">
					<BucketAllocation columns = { this.state.columns } bucketsByRows = { this.state.bucketsByRows }/>
					<BucketSummary portfolioSummary = { this.state.portfolioSummary } />
					<div>&nbsp;</div>
				</div>:
				<div className="col-sm-8">
			   		<BucketSummaryPlaceholder />
				</div> }

			<div className="col-sm-4">
				<Constraint />
				<MuniList munis={ munis }/>
			</div>


			<div>&nbsp;</div><div>&nbsp;</div>

		</div>
      </div>
    );
  }
}


export default App;
