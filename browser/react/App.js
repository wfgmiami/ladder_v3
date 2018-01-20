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
import PortfolioSummary from './PortfolioSummary';
import muniList from '../../muniData.json';
import BucketSummaryPlaceholder from './BucketSummaryPlaceholder';
import css from '../../assets/stylesheets/style.scss';

const Promise = require('es6-promise-promise');

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
			maxPercBond: 0.1,
			minAllocBond: 25000,
			minIncrement: 5000,
			maxAllocBond: 100000,
			maxSector: 0.30,
			maxHealthCare: 0.12,
			maxRating: 0.30,
			maxCAState: 0.2,
			maxNYState: 0.2,
			maxState: 0.2,
			munis:[],
			ytmLadder:[],
			rankedMuniList:[],
			allocatedData: [],
			allocSector: {},
			allocRating: {},
			investedAmount: 1000000,
			bucketsByRows: [],
			columns: [],
			bucketsSummary: [],
			portfolioSummary: [],
			healthCare: 0,
			aRatingAndBelow: 0,
			sector:{},
			ranking: ['HealthCare', 'nyMunis', 'caMunis', 'aRated', 'aaRated', 'couponRated'],
			cashReducer: 'Yes',
			tradePars: []
		};

		this.filterMaturity = this.filterMaturity.bind(this);
		this.setLadder = this.setLadder.bind(this);
		this.generateLadder = this.generateLadder.bind(this);
		this.createRanking = this.createRanking.bind(this);
		this.createRows = this.createRows.bind(this);
		this.createColumns = this.createColumns.bind(this);
		this.createSummary = this.createSummary.bind(this);
		this.lookForBondInDiffRanking = this.lookForBondInDiffRanking.bind(this);
		this.checkBondForLimitSize = this.checkBondForLimitSize.bind(this);
		this.allocateData = this.allocateData.bind(this);
		this.handleLimit = this.handleLimit.bind(this);
		this.allocateCash = this.allocateCash.bind(this);
		this.handleMinAllocChange = this.handleMinAllocChange.bind(this);
		this.handleCashReducerChange = this.handleCashReducerChange.bind(this);
		this.optimize = this.optimize.bind(this);
  }

	 componentDidMount() {
		let tradePars = [];
		for( let i = this.state.minAllocBond; i <= this.state.maxAllocBond; i += this.state.minIncrement ){
			tradePars.push(i);
		}
		this.setState( { tradePars } );

		this.setState({ munis: muniList }, () => {
			this.filterMaturity( { min: 1, max: 5 } )
		});
	}

  	handleMinAllocChange( minAlloc ){
		this.setState( { minAllocBond:  minAlloc } );
	}

	handleCashReducerChange( cashReducer ){
		this.setState( { cashReducer:  cashReducer } );
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
				if( this.state.ytmLadder[0] === 1 ){
					const oneYearPriceFilter = munis.filter( muni => {
						if( muni.price >= 100 && muni.price <= 105 ) return muni;
					})
					this.setState( { munis: oneYearPriceFilter } );
				}else{
					this.setState( { munis } );
				}
			})
			.then( () => this.createRanking() )
			.catch( err => console.log( err ) );
  }

  createRanking(){
		const ladderBuckets = this.state.ytmLadder;
		let rankedMunis = {};
		let nyPruned = {};
		let caPruned = {};
		let aRatedPruned = {};
		let aaRatedPruned = {};
		let couponPruned = {};
		let tempObj = {};
		let rankedMuniList = [];
		let selectedMunis = [];
		let sortedByTrade = {};
		let sortedByTradeMunis = [];


		ladderBuckets.forEach( bucket => {
			let munis = this.state.munis.filter( muni => muni.ytm == bucket );
			let healthCareMunis = munis.filter( muni => muni.sector == 'Health Care' );
			healthCareMunis.forEach( hcMuni => hcMuni.rank = 'HealthCare' );
			let nyMunis = munis.filter( muni => muni.state == 'NY' );
			let caMunis = munis.filter( muni => muni.state == 'CA' );
			let aRated = munis.filter( muni => muni.rating == 'A' )
								.concat( munis.filter( muni => muni.rating == 'A+') )
								.concat( munis.filter( muni => muni.rating == 'A-' ))
								.concat( munis.filter( muni => muni.rating.slice(0,2) == 'A/' ));
			let aaRated = munis.filter( muni => muni.rating.slice(0,2) == 'AA' );
			let couponRated = munis.sort( ( a,b ) => b.coupon - a.coupon );
			rankedMunis[bucket]=[{ 'HealthCare': healthCareMunis, 'nyMunis': nyMunis, 'caMunis': caMunis, 'aRated': aRated, 'aaRated': aaRated, 'couponRated': couponRated }];

		})

		ladderBuckets.forEach( bucket => {
				rankedMunis[bucket][0]['HealthCare'].forEach( hcMuni => tempObj[hcMuni.cusip] = hcMuni );
				nyPruned[bucket] = rankedMunis[bucket][0]['nyMunis'].filter( nyMuni => !( nyMuni.cusip in tempObj ));
				caPruned[bucket] = rankedMunis[bucket][0]['caMunis'].filter( caMuni => !( caMuni.cusip in tempObj ));
				aRatedPruned[bucket] = rankedMunis[bucket][0]['aRated'].filter( aRated => !(aRated.cusip in tempObj ));
				aaRatedPruned[bucket] = rankedMunis[bucket][0]['aaRated'].filter( aaRated => !(aaRated.cusip in tempObj ));
				couponPruned[bucket] = rankedMunis[bucket][0]['couponRated'].filter( couponMuni => !(couponMuni.cusip in tempObj ));

				tempObj = {};
				rankedMunis[bucket][0]['nyMunis'].forEach( nyMuni => tempObj[nyMuni.cusip] = nyMuni );
				aRatedPruned[bucket] = aRatedPruned[bucket].filter( aRated => !( aRated.cusip in tempObj ));
				aaRatedPruned[bucket] = aaRatedPruned[bucket].filter( aaRated => !( aaRated.cusip in tempObj ));
				couponPruned[bucket] = couponPruned[bucket].filter( couponMuni => !(couponMuni.cusip in tempObj ));

				tempObj = {};
				rankedMunis[bucket][0]['caMunis'].forEach( caMuni => tempObj[caMuni.cusip] = caMuni );
				aRatedPruned[bucket] = aRatedPruned[bucket].filter( aRated => !( aRated.cusip in tempObj ));
				aaRatedPruned[bucket] = aaRatedPruned[bucket].filter( aaRated => !( aaRated.cusip in tempObj ));
				couponPruned[bucket] = couponPruned[bucket].filter( couponMuni => !(couponMuni.cusip in tempObj ));

				tempObj = {};
				rankedMunis[bucket][0]['aRated'].forEach( aRated => tempObj[aRated.cusip] = aRated );
				couponPruned[bucket] = couponPruned[bucket].filter( couponMuni => !(couponMuni.cusip in tempObj ));

				tempObj = {};
				rankedMunis[bucket][0]['aaRated'].forEach( aaRated => tempObj[aaRated.cusip] = aaRated );
				couponPruned[bucket] = couponPruned[bucket].filter( couponMuni => !(couponMuni.cusip in tempObj ));

				nyPruned[bucket].forEach( couponRatedMuni => couponRatedMuni.rank = 'nyRated');
				caPruned[bucket].forEach( couponRatedMuni => couponRatedMuni.rank = 'caRated');
				aRatedPruned[bucket].forEach( couponRatedMuni => couponRatedMuni.rank = 'aRated');
				aaRatedPruned[bucket].forEach( couponRatedMuni => couponRatedMuni.rank = 'aaRated');
				couponPruned[bucket].forEach( couponRatedMuni => couponRatedMuni.rank = 'couponRated');

				rankedMuniList[bucket] = { 'HealthCare': rankedMunis[bucket][0]['HealthCare'], 'nyMunis': nyPruned[bucket], 'caMunis': caPruned[bucket], 'aRated': aRatedPruned[bucket], 'aaRated': aaRatedPruned[bucket], 'couponRated': couponPruned[bucket] };
				tempObj = {};
		})

		ladderBuckets.forEach( bucket => {
			Object.keys( rankedMuniList[bucket] ).forEach( rank => {
				selectedMunis = rankedMuniList[bucket][rank].map( function( muni, id ) { return { id: id, dt: new Date( muni.lastTraded ).getTime(), muni: muni } } )
							.sort( ( a,b ) => b.dt - a.dt )
							.map( muni => rankedMuniList[bucket][rank][muni.id] );

				sortedByTrade[rank] = selectedMunis;
			})

			sortedByTradeMunis[bucket] = sortedByTrade;
			sortedByTrade = {};
		})


		this.setState({ rankedMuniList: sortedByTradeMunis });
  }

	setLadder( investedAmount ){

		const buckets = [...this.state.ytmLadder];
		let bucketsObj = {};
		let bucketStateKeys = [];

		for( let i = buckets[0]; i <= buckets[buckets.length - 1]; i++ ){
			bucketsObj[i] = { currentRankIndex: 0, currentBondIndex: 0, allocSector: {},allocRating: {}, allocState: {} };
		}

		bucketStateKeys = Object.keys( bucketsObj )
		.sort( function(a,b){ return b - a } )

		bucketsObj['bucketStateKeys'] = bucketStateKeys;

		this.setState({ investedAmount }, () => {
			this.generateLadder( bucketsObj );
		});


	}

	allocateData( argsObj, allocatedData, allocBucket, allocSector, allocRating, allocState, bucketState, bucket ){

		const investedAmount = this.state.investedAmount;
		const maxHealthCare = this.state.maxHealthCare * investedAmount;
		const maxSector = this.state.maxSector * investedAmount;
		const maxNYState = this.state.maxNYState * investedAmount;
		const maxCAState = this.state.maxCAState * investedAmount;
		const maxState = this.state.maxState * investedAmount;
		const maxAandBelow = this.state.maxRating * investedAmount;
		const minIncrement = this.state.minIncrement;
		const allocatedAmount = argsObj.allocatedAmount;
		const args = [].slice.call( arguments );
		const bucketMoney = argsObj.bucketMoney;
		const ranking = argsObj.ranking;
		let currentBondIndex = argsObj.currentBucketState.currentBondIndex - 1;
		let previousBucket = 0;
		let previousAllocatedBond = '';
		let checkSector = '';
		let chosenBond = argsObj.chosenBond;
		let sector = argsObj.chosenBond.sector;
		let rating = argsObj.chosenBond.rating;
		let state = argsObj.chosenBond.state;
		let checkBucket = 0;
		let minIncrementToAllocate  = 0;
		let bucketLastIndex = 0;
		let idx = 0;
		let allocateToCash = 0;
		let sectorLimitCheck = 0;
		let nyStateLimitCheck = 0;
		let caStateLimitCheck = 0;
		let stateLimitCheck = 0;
		let aAndBelowLimitCheck = 0;
		let currBucketIdx = 0;
		let statePlaceholder = '';
		let lastBucket = '';
		let checkState = '';
		let checkRating = '';
		let checkedAll = false;
		let checkedRating = false;
		let maxStateHit = false;
		let maxSectorHit = false;
		let maxAandBelowHit = false;
		let sectorAdjustedBond = null;
		let stateAdjustedBond = null;
		let aAndBelowAdjustedBond = null;
		let adjustedBond = null;
		let cashObject = {};
		const availableBuckets = argsObj.buckets;
		const availableBucketsLen = argsObj.buckets.length - 1;

		if( rating === '' ) rating = 'B';

		chosenBond['investAmt'] = allocatedAmount;

		allocBucket[bucket] ? allocBucket[bucket] += allocatedAmount
		: allocBucket[bucket] = allocatedAmount;

		allocatedData[bucket] ? allocatedData[bucket].push( chosenBond )
		: allocatedData[bucket] = [chosenBond];

		if(	chosenBond.cusip !== 'Cash' ){
			allocSector[sector] ? allocSector[sector] += allocatedAmount
			: allocSector[sector] = allocatedAmount;
		}

		if( rating.slice(0,2) !== 'AA' ){
			allocRating['aAndBelow'] ? allocRating['aAndBelow'] += allocatedAmount
			: allocRating['aAndBelow'] = allocatedAmount
		}

		allocState[state] ? allocState[state] += allocatedAmount : allocState[state] = allocatedAmount

		/*	
		if( state == 'NY' ){
			allocState['NY'] ? allocState['NY'] += allocatedAmount
			: allocState['NY'] = allocatedAmount
		}else if( state == 'CA' ){
			allocState['CA'] ? allocState['CA'] += allocatedAmount
			: allocState['CA'] = allocatedAmount
		}
*/
		const bucketInfo = {
			allocSector,
			allocState,
			allocBucket,
			allocRating,
			allocatedData,
			minIncrement,
			maxHealthCare,
			maxSector,
			maxAandBelow,
			maxNYState,
			maxCAState,
			maxState,
			availableBuckets,
			chosenBond,
			allocatedAmount,
			bucket,
			rating,
			ranking,
			sector,
			argsObj,
			state,
			bucketState,
			aAndBelowAdjustedBond,
			sectorAdjustedBond,
			stateAdjustedBond
		}

		if( ( sector === 'Health Care' && allocSector[sector] > maxHealthCare ) || allocSector[sector] > maxSector ){
		//	debugger;
			maxSectorHit = true;
			sector === 'Health Care' ? bucketInfo.calledBy = 'HealthCare' : bucketInfo.calledBy = 'sector';

				this.handleLimit( bucketInfo );
				sectorAdjustedBond = bucketInfo.sectorAdjustedBond;
		}

		if( allocState['CA'] >= maxCAState  || allocState['NY'] >= maxNYState ){
		  //debugger;
			maxStateHit = true;
			state === 'CA' ? statePlaceholder = 'CA' : statePlaceholder = 'NY';
			bucketInfo.calledBy = statePlaceholder;
			this.handleLimit( bucketInfo );
			stateAdjustedBond = bucketInfo.stateAdjustedBond;
		}
		
		if( allocState[state] > maxState ){
			maxStateHit = true;
			bucketInfo.calledBy = 'state';
			this.handleLimit( bucketInfo );
			stateAdjustedBond = bucketInfo.stateAdjustedBond;
		}

		if( allocRating['aAndBelow'] >= maxAandBelow ){
			//debugger;
			maxAandBelowHit = true;
			bucketInfo.calledBy = 'aAndBelow';
			this.handleLimit( bucketInfo );
			aAndBelowAdjustedBond = bucketInfo.aAndBelowAdjustedBond;
		}


		if( allocBucket[bucket] >= bucketMoney ){
			debugger;
			let minAlloc = minIncrement;

			if( maxSectorHit || maxAandBelowHit || maxStateHit ){

				if( argsObj.bucketControl['nextBucket'] ){
					argsObj.bucketControl['nextBucket'] = null;
					adjustedBond = allocatedData[bucket][allocatedData[bucket].length - 1];
				}else{
					adjustedBond = !bucketInfo.sectorAdjustedBond ? ( !bucketInfo.stateAdjustedBond ? ( !bucketInfo.aAndBelowAdjustedBond ? null : bucketInfo.aAndBelowAdjustedBond ) : bucketInfo.stateAdjustedBond ) : bucketInfo.sectorAdjustedBond;
				}

				if( !adjustedBond ){
					adjustedBond = allocatedData[bucket][allocatedData[bucket].length - 1];
				}

				let amountToRemove = adjustedBond['investAmt'];
				allocSector[sector] -= amountToRemove;
				allocBucket[bucket] -= amountToRemove;
				adjustedBond['investAmt'] -= amountToRemove;
				if( adjustedBond.rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] -= amountToRemove;	
				allocState[state] -= amountToRemove;			
				
				if( adjustedBond['investAmt'] === 0 ) minAlloc = this.state.minAllocBond;
				minIncrementToAllocate = ( bucketMoney - allocBucket[bucket] ) / ( minAlloc * (  adjustedBond.price * 1 / 100 ) );
				minIncrementToAllocate = Math.floor( minIncrementToAllocate ) * ( minAlloc * adjustedBond.price * 1 / 100 );
			
				if( ( previousAllocatedBond.sector === 'Health Care' && sectorLimitCheck  > maxHealthCare )
				|| ( sectorLimitCheck > maxSector ) || ( stateLimitCheck > maxState ) || ( nyStateLimitCheck > maxNYState || caStateLimitCheck > maxCAState )
				|| ( aAndBelowLimitCheck > maxAandBelow ) || ( previousAllocatedBond['investAmt'] + minIncrementToAllocate ) > this.state.maxPercBond * this.state.investedAmount || ( ( previousAllocatedBond['investAmt'] + minIncrementToAllocate ) / ( previousAllocatedBond.price / 100 ) ) > this.state.maxAllocBond ){
			
			//	if( ( previousAllocatedBond['investAmt'] + minIncrementToAllocate ) > this.state.maxPercBond * this.state.investedAmount ||
			//	( ( previousAllocatedBond['investAmt'] + minIncrementToAllocate ) / ( previousAllocatedBond.price / 100 ) ) > this.state.maxAllocBond ){

					cashObject['cusip'] = 'Cash';
					cashObject['investAmt'] = allocateToCash;
					allocatedData[bucket].push( cashObject );
					allocSector['Cash'] =  bucketMoney - allocBucket[bucket];
				}else{
					allocBucket[bucket] += minIncrementToAllocate;
					allocSector[sector] += minIncrementToAllocate;
					adjustedBond['investAmt'] += minIncrementToAllocate;
					allocState[state] += minIncrementToAllocate;
					if( adjustedBond.rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] += minIncrementToAllocate;
					if( adjustedBond['investAmt'] === 0 ) allocatedData[bucket].splice( allocatedData[bucket].length - 1, 1 );

					allocateToCash = bucketMoney - allocBucket[bucket];
					cashObject['cusip'] = 'Cash';
					cashObject['investAmt'] = allocateToCash;
					allocatedData[bucket].push( cashObject );
					allocSector['Cash'] += allocateToCash;
				}
			}else{
				allocSector[sector] -= allocatedAmount;
				allocBucket[bucket] -= allocatedAmount;	
				chosenBond['investAmt'] -= allocatedAmount;
				if( rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] -= allocatedAmount;
				//if( state === 'NY' ) allocState['NY'] -= allocatedAmount;
				//if( state === 'CA' ) allocState['CA'] -= allocatedAmount;
				allocState[state] -= allocatedAmount;

				idx = allocatedData[bucket].length - 2;
				if( idx < 0 ) idx = 0;
				previousAllocatedBond = allocatedData[bucket][idx];

				sectorLimitCheck = allocSector[previousAllocatedBond.sector];
				stateLimitCheck = allocState[previousAllocatedBond.state];
				nyStateLimitCheck = allocState['NY'];
				caStateLimitCheck = allocState['CA'];
				aAndBelowLimitCheck = allocRating['aAndBelow'];
				
				if( !previousAllocatedBond ) minAlloc = this.state.minAllocBond;
				minIncrementToAllocate = ( bucketMoney - allocBucket[bucket] ) / ( minAlloc * ( previousAllocatedBond.price * 1 / 100 ) );

				minIncrementToAllocate = Math.floor( minIncrementToAllocate ) * ( minAlloc * previousAllocatedBond.price * 1 / 100 );

				sectorLimitCheck += minIncrementToAllocate;
				stateLimitCheck += minIncrementToAllocate;
				if( previousAllocatedBond.state === 'NY' ) nyStateLimitCheck += minIncrementToAllocate;
				if( previousAllocatedBond.state === 'CA' ) caStateLimitCheck += minIncrementToAllocate;
				
				if( previousAllocatedBond.rating.slice(0,2) !== 'AA' ) aAndBelowLimitCheck += minIncrementToAllocate;

				if( ( previousAllocatedBond.sector === 'Health Care' && sectorLimitCheck  > maxHealthCare )
				|| ( sectorLimitCheck > maxSector ) || ( stateLimitCheck > maxState ) || ( nyStateLimitCheck > maxNYState || caStateLimitCheck > maxCAState )
				|| ( aAndBelowLimitCheck > maxAandBelow ) || ( previousAllocatedBond['investAmt'] + minIncrementToAllocate ) > this.state.maxPercBond * this.state.investedAmount || ( ( previousAllocatedBond['investAmt'] + minIncrementToAllocate ) / ( previousAllocatedBond.price / 100 ) ) > this.state.maxAllocBond ){

					allocateToCash = bucketMoney - allocBucket[bucket];

					cashObject['cusip'] = 'Cash';
					cashObject['investAmt'] = allocateToCash;
					allocatedData[bucket].splice( allocatedData[bucket].length - 1, 1 );
					allocatedData[bucket].push( cashObject );
					allocSector['Cash'] += allocateToCash;
					allocBucket[bucket] += minIncrementToAllocate;

				}else{

					allocBucket[bucket] += minIncrementToAllocate;
					allocSector[sector] += minIncrementToAllocate;
					previousAllocatedBond['investAmt'] += minIncrementToAllocate;
					if( previousAllocatedBond.rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] += minIncrementToAllocate;
				//	if( previousAllocatedBond.state === 'NY' ) allocState['NY'] += minIncrementToAllocate;
				//	if( previousAllocatedBond.state === 'CA' ) allocState['CA'] += minIncrementToAllocate;
					allocState[previousAllocatedBond.state] += minIncrementToAllocate;

					allocateToCash = bucketMoney - allocBucket[bucket];
					cashObject['cusip'] = 'Cash';
					cashObject['investAmt'] = allocateToCash;
					if( allocatedData[bucket].length - 1 !== 0 || previousAllocatedBond['investAmt'] == 0 ) 
					allocatedData[bucket].splice( allocatedData[bucket].length - 1, 1 );
					allocatedData[bucket].push( cashObject );
					allocSector['Cash'] += allocateToCash;
				}

			}
			idx = argsObj.buckets.indexOf( bucket );
			argsObj.buckets.splice( idx, 1 );

		}
	}

	optimize( bucketInfo ){
		let trackObj = { closeToLimit: [], parOne: [], parTwo: [] };
		let allocLimit = 0;
		let closeToLimit = 0;
		const prevBondInvestAmt = bucketInfo.previousAllocatedBond.investAmt;
		const sector = bucketInfo.sector;
		const state = bucketInfo.state;
		const firstPrice = bucketInfo.previousAllocatedBond.price /100;
		const secondPrice = bucketInfo.chosenBond.price / 100;
		const calledBy = bucketInfo.calledBy;
		const maxAllocPerBond = this.state.maxPercBond * this.state.investedAmount;
//debugger;
	   	if( calledBy === 'HealthCare' ){
			allocLimit = bucketInfo.maxHealthCare - ( bucketInfo.allocSector['Health Care'] - prevBondInvestAmt );

		}else if( calledBy === 'NY' ){
			allocLimit = bucketInfo.maxNYState - ( bucketInfo.allocState['NY'] - prevBondInvestAmt );

		}else if( calledBy === 'CA' ){
			allocLimit = bucketInfo.maxCAState - ( bucketInfo.allocState['CA'] - prevBondInvestAmt );

		}else if( calledBy === 'sector' ){
			allocLimit = bucketInfo.maxSector - ( bucketInfo.allocSector[sector] - prevBondInvestAmt );

		}else if( calledBy === 'aAndBelow' ){
			allocLimit = bucketInfo.maxAandBelow - ( bucketInfo.allocRating['aAndBelow'] - prevBondInvestAmt );

		}else if( calledBy === 'state' ){
			allocLimit = bucketInfo.maxState - ( bucketInfo.allocState[state] - prevBondInvestAmt );
		}

		const tradePars = this.state.tradePars;
		for( let par1 = 0; par1 < tradePars.length - 1; par1++ ){
			for( let par2 = 0; par2 < tradePars.length - 1; par2++ ){
				if( tradePars[par1] * firstPrice <= maxAllocPerBond && tradePars[par2] * secondPrice <= maxAllocPerBond ){
					if( tradePars[par1] * firstPrice + tradePars[par2] * secondPrice === allocLimit){
						trackObj.closeToLimit.push( 0 );
						trackObj.parOne.push( tradePars[par1] );
						trackObj.parTwo.push( tradePars[par2] );
					}else if( tradePars[par1] * firstPrice + tradePars[par2] * secondPrice < allocLimit ){
						closeToLimit = allocLimit - ( tradePars[par1] * firstPrice + tradePars[par2] * secondPrice );
						trackObj.closeToLimit.push( closeToLimit );
						trackObj.parOne.push( tradePars[par1] );
						trackObj.parTwo.push( tradePars[par2] );
					}
				}
			}
		}
		let closest = Math.min( ...trackObj.closeToLimit );

		for( let i = 0; i < trackObj['closeToLimit'].length; i++ ){
			if( trackObj['closeToLimit'][i] === closest ) return [ trackObj.parOne[i], trackObj.parTwo[i] ];
		}
		return [];
	}

	handleLimit( bucketInfo ){

		const allocSector = bucketInfo.allocSector;
		const allocBucket = bucketInfo.allocBucket;
		const allocState = bucketInfo.allocState;
		const currentBucketState = bucketInfo.argsObj.currentBucketState;
		const chosenBond = bucketInfo.chosenBond;
		const allocRating = bucketInfo.allocRating;
		const allocatedData = bucketInfo.allocatedData;
		const bucket = bucketInfo.bucket;
		const state = bucketInfo.state;
		const sector = bucketInfo.sector;
		const rating = bucketInfo.rating;
		const ranking = bucketInfo.ranking;
		const bucketState = bucketInfo.bucketState;
		const allocatedAmount = bucketInfo.allocatedAmount;
		const availableBuckets = bucketInfo.availableBuckets;
		const minIncrement = bucketInfo.minIncrement;
		const maxHealthCare = bucketInfo.maxHealthCare;
		const maxAandBelow = bucketInfo.maxAandBelow;
		const maxNYState = bucketInfo.maxNYState;
		const maxCAState = bucketInfo.maxCAState;
		const maxState = bucketInfo.maxState;
		const maxSector = bucketInfo.maxSector;
		const availableBucketsLen = bucketInfo.argsObj.buckets.length - 1;
		const calledBy = bucketInfo.calledBy;

		let sectorLimitCheck = 0;
		let nyStateLimitCheck = 0;
		let caStateLimitCheck = 0;
		let aAndBelowLimitCheck = 0;
		let stateLimitCheck = 0;

		let bucketControl = bucketInfo.argsObj.bucketControl;
		let checkedAll = false;
		let previousAllocatedBond = '';
		let minIncrementToAllocate = 0;
		let rankIndex = null;
		let checkedRating = false;
		let checkRating = '';
		let checkRatingOrState = false;
		let statePlaceholder = '';
		let allocationLimit = '';
		let checkState = '';
		let checkSector = '';
		let currentAllocation = {};
		let allocatedDataLength = allocatedData[bucket].length - 1;

		if( calledBy === 'aAndBelow' ){
			ranking === 'aRated' ? rankIndex = 3 : rankIndex = null;
			allocationLimit = maxAandBelow;
		}else if( calledBy === 'NY' || calledBy === 'CA' ){
			calledBy === 'CA' ? statePlaceholder = 'CA' : statePlaceholder = 'NY';
			allocationLimit = statePlaceholder === 'CA' ? maxCAState : maxNYState;
			ranking === 'nyMunis' ? rankIndex = 1 : rankIndex = 2;
		}else if( calledBy === 'sector' || calledBy === 'HealthCare' ){
			allocationLimit = calledBy === 'sector' ? maxSector : maxHealthCare;
			ranking === 'HealthCare' ? rankIndex = 0 : null;
		}else if( calledBy === 'state' ){
			allocationLimit = maxState;
		}

//debugger;
		allocSector[sector] -= allocatedAmount;
		allocBucket[bucket] -= allocatedAmount;	
		chosenBond['investAmt'] -= allocatedAmount;
		if( rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] -= allocatedAmount;
		allocState[state] -= allocatedAmount;

		allocatedData[bucket].splice( allocatedDataLength, 1 );

		allocatedDataLength = allocatedData[bucket].length - 1;
		const lastBucket = availableBuckets[availableBucketsLen];
		let currBucketIdx = availableBuckets.indexOf(bucket);
		let checkBucket = availableBuckets[currBucketIdx];

		if( allocatedDataLength < 0 ){
			if( checkBucket > lastBucket ){
				checkBucket = availableBuckets[0];
				currBucketIdx = 0;
				allocatedDataLength = allocatedData[checkBucket].length - 1;
			}else{
				checkBucket = availableBuckets[++currBucketIdx];
				if( checkBucket ){
					allocatedDataLength = allocatedData[checkBucket].length - 1;
				}else{
					checkedAll = true;
				}
			}
			if ( bucketControl['nextBucket'] === null ) bucketControl['nextBucket'] = bucket;
		}

		if( calledBy === 'aAndBelow' && !checkedAll ){
			checkRating = allocatedData[checkBucket][allocatedDataLength].rating.slice(0,2);
			checkRating !== 'AA' ? checkedRating = true : checkedRating = false;
			checkRatingOrState = checkedRating;
			currentAllocation = allocRating['aAndBelow'];
			if( ranking === 'aRated' || ranking === 'aaRated' || ranking === 'couponRated' || ranking === 'nyMunis' || ranking === 'caMunis' ){
				if( allocatedData[checkBucket][allocatedDataLength].state === 'NY' ||
					 allocatedData[checkBucket][allocatedDataLength].state === 'CA' ||
					 allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care'){
					checkRatingOrState = false;
				}
			}
		}else if( ( calledBy === 'NY' || calledBy === 'CA' ) && !checkedAll ){
			checkState = allocatedData[checkBucket][allocatedDataLength].state;
			checkRatingOrState = checkState === state;
			currentAllocation = allocState[statePlaceholder];
			if( allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care' ) checkRatingOrState = false;
		}else if( ( calledBy === 'sector' || calledBy === 'HealthCare' ) && !checkedAll ){
			checkSector = allocatedData[checkBucket][allocatedDataLength].sector;
			checkRatingOrState = checkSector === sector;
			currentAllocation = allocSector[sector];
			if( ranking === 'aRated' || ranking === 'aaRated' || ranking === 'couponRated' || ranking === 'nyMunis' || ranking === 'caMunis' ){

				if( allocatedData[checkBucket][allocatedDataLength].state === 'NY' ||
					 allocatedData[checkBucket][allocatedDataLength].state === 'CA' ||
					 allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care'){
					checkRatingOrState = false;
				}
				if( ranking === 'aaRated' || ranking === 'couponRated' ){
					if( allocatedData[checkBucket][allocatedDataLength].rating.slice(0,2) !== 'AA' ){
						checkRatingOrState = false;
					}
				}
			}
		}else if( calledBy === 'state' && !checkedAll ){
			checkState = allocatedData[checkBucket][allocatedDataLength].state;
			checkRatingOrState = checkState === state;
			currentAllocation = allocState[state];
			if( allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care' || allocatedData[checkBucket][allocatedDataLength].rating.slice(0,2) !== 'AA' ) checkRatingOrState = false;
		}

		while( !checkRatingOrState && !checkedAll ){
			if( !allocatedDataLength ){
				if ( bucketControl['nextBucket'] === null ) bucketControl['nextBucket'] = bucket;

				if( ++checkBucket > lastBucket ){
					checkBucket = availableBuckets[0];
					currBucketIdx = 0;
					if( !allocatedData[checkBucket] ) checkBucket = bucket;
						allocatedDataLength = allocatedData[checkBucket].length - 1;
					if( checkBucket === bucket ) checkedAll = true;
				}else{
					checkBucket = availableBuckets[++currBucketIdx];
					allocatedDataLength = allocatedData[checkBucket].length - 1;
					if( checkBucket === bucket ) checkedAll = true;
				}
			}else{
				if( availableBuckets[allocatedDataLength + 1] > lastBucket ){
					allocatedDataLength = 0;
				}else{
					allocatedDataLength--;
				}
			}

			if( calledBy === 'aAndBelow' && !checkedAll ){
				checkRating = allocatedData[checkBucket][allocatedDataLength].rating.slice(0,2);
				if( checkRating !== 'AA' ) checkRatingOrState = true;
				if( ranking === 'aRated' || ranking === 'aaRated' || ranking === 'couponRated' || ranking === 'nyMunis' || ranking === 'caMunis' ){
					if( allocatedData[checkBucket][allocatedDataLength].state === 'NY' ||
						 allocatedData[checkBucket][allocatedDataLength].state === 'CA' ||
						 allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care'){
						checkRatingOrState = false;
					}
				}
			}else if( ( calledBy === 'NY' || calledBy === 'CA' ) && !checkedAll ){
				checkState = allocatedData[checkBucket][allocatedDataLength].state;
				if( checkState === state ) checkRatingOrState = true;
				if( allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care' ) checkRatingOrState = false;

			}else if( ( calledBy === 'sector' || calledBy === 'HealthCare' ) && !checkedAll ){
				checkSector = allocatedData[checkBucket][allocatedDataLength].sector;

				if( checkSector === sector ) checkRatingOrState = true;
				if( ranking === 'aRated' || ranking === 'aaRated' || ranking === 'couponRated' || ranking === 'nyMunis' || ranking === 'caMunis' ){
					if( allocatedData[checkBucket][allocatedDataLength].state === 'NY' ||
						 allocatedData[checkBucket][allocatedDataLength].state === 'CA' ||
						 allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care'){
						checkRatingOrState = false;
					}
					if( ranking === 'aaRated' || ranking === 'couponRated' ){
						if( allocatedData[checkBucket][allocatedDataLength].rating.slice(0,2) !== 'AA' ){
							checkRatingOrState = false;
						}
					}
				}
			}else if( calledBy === 'state' && !checkedAll ){
				checkState = allocatedData[checkBucket][allocatedDataLength].state;
				checkRatingOrState = checkState === state;
				currentAllocation = allocState[state];
				if( allocatedData[checkBucket][allocatedDataLength].sector === 'Health Care' || allocatedData[checkBucket][allocatedDataLength].rating.slice(0,2) !== 'AA' ) checkRatingOrState = false;
			}
		}

		if( !checkedAll ){

			previousAllocatedBond = allocatedData[checkBucket][allocatedDataLength];
			bucketInfo.previousAllocatedBond = previousAllocatedBond;
			//debugger;
			let parCombination = this.optimize(bucketInfo);
			let prevBondAlloc = parCombination[0] * previousAllocatedBond.price / 100;
			let chosenBondNewAlloc = parCombination[1] * chosenBond.price / 100;

			minIncrementToAllocate = prevBondAlloc + chosenBondNewAlloc - previousAllocatedBond.investAmt;
			let prevAllocBondChange = prevBondAlloc - previousAllocatedBond.investAmt;
			let sectorLimitCheckPrev = allocSector[previousAllocatedBond.sector];
			let sectorLimitCheckChosen = allocSector[chosenBond.sector];
		
			let stateLimitCheckPrev = allocState[previousAllocatedBond.state];
			let stateLimitCheckChosen = allocState[chosenBond.state];

			nyStateLimitCheck = allocState['NY'];
			caStateLimitCheck = allocState['CA'];
			aAndBelowLimitCheck = allocRating['aAndBelow'];
			

			if( previousAllocatedBond.sector !== chosenBond.sector ){
				sectorLimitCheckPrev += prevAllocBondChange;
				sectorLimitCheckChosen += chosenBondNewAlloc;
			}else{
				sectorLimitCheckPrev = 0;
				sectorLimitCheckChosen += minIncrementToAllocate;
			}

			if( previousAllocatedBond.state !== chosenBond.state ){
				stateLimitCheckPrev += prevAllocBondChange;
				stateLimitCheckChosen += chosenBondNewAlloc;
			}else{
				stateLimitCheckPrev = 0;
				stateLimitCheckChosen += minIncrementToAllocate;
			}


			if( previousAllocatedBond.state === 'NY' ) nyStateLimitCheck += prevAllocBondChange;
			if( previousAllocatedBond.state === 'CA' ) caStateLimitCheck += prevAllocBondChange;
			if( previousAllocatedBond.rating.slice(0,2) !== 'AA' ) aAndBelowLimitCheck += prevAllocBondChange;
		
			if( chosenBond.state === 'NY' ) nyStateLimitCheck += chosenBondNewAlloc;
			if( chosenBond.state === 'CA' ) caStateLimitCheck += chosenBondNewAlloc;
			

			if( chosenBond.rating.slice(0,2) !== 'AA' ) aAndBelowLimitCheck += chosenBondNewAlloc;

			if( ( previousAllocatedBond.sector === 'Health Care' && sectorLimitCheck > maxHealthCare )
			||  ( stateLimitCheckPrev > maxState ) || ( stateLimitCheckChosen > maxState ) || ( sectorLimitCheckPrev > maxSector ) || ( sectorLimitCheckChosen > maxSector ) || ( nyStateLimitCheck > maxNYState || caStateLimitCheck > maxCAState || parCombination.length === 0 )
			|| ( aAndBelowLimitCheck > maxAandBelow ) ){
				sectorLimitCheck = allocSector[previousAllocatedBond.sector];
				nyStateLimitCheck = allocState['NY'];
				caStateLimitCheck = allocState['CA'];
				aAndBelowLimitCheck = allocRating['aAndBelow'];
				stateLimitCheck = allocState[state]

				minIncrementToAllocate = ( allocationLimit - currentAllocation ) / ( minIncrement * ( previousAllocatedBond.price * 1 / 100 ) );
				minIncrementToAllocate = Math.floor( minIncrementToAllocate ) * ( minIncrement * previousAllocatedBond.price * 1 / 100 );

				sectorLimitCheck += minIncrementToAllocate;
				if( previousAllocatedBond.state === 'NY' ) nyStateLimitCheck += minIncrementToAllocate;
				if( previousAllocatedBond.state === 'CA' ) caStateLimitCheck += minIncrementToAllocate;
				if( previousAllocatedBond.rating.slice(0,2) !== 'AA' ) aAndBelowLimitCheck += minIncrementToAllocate;

				if( ( previousAllocatedBond.sector === 'Health Care' && sectorLimitCheck > maxHealthCare )
					|| ( stateLimitCheck > maxState ) || ( sectorLimitCheck > maxSector ) || ( nyStateLimitCheck > maxNYState || caStateLimitCheck > maxCAState )
					|| ( aAndBelowLimitCheck > maxAandBelow ) || ( previousAllocatedBond['investAmt'] + minIncrementToAllocate ) > this.state.maxPercBond * this.state.investedAmount ){

						if ( bucketControl['nextBucket'] === null ) bucketControl['nextBucket'] = bucket;

				}else{

				
					allocBucket[checkBucket] += minIncrementToAllocate;
					allocSector[sector] += minIncrementToAllocate;
					allocState[state] += minIncrementToAllocate;
					previousAllocatedBond['investAmt'] += minIncrementToAllocate;

					if( previousAllocatedBond.rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] += minIncrementToAllocate;
					//if( previousAllocatedBond.state === 'NY' ) allocState['NY'] += minIncrementToAllocate;
					//if( previousAllocatedBond.state === 'CA' ) allocState['CA'] += minIncrementToAllocate;
					if( ranking === 'aRated' || ranking === 'caMunis' || ranking === 'nyMunis' || ranking === 'HealthCare' ){
						bucketState.bucketStateKeys.forEach( bucket => {
							if( bucketState[bucket].currentRankIndex === rankIndex ){
								bucketState[bucket].currentRankIndex++;
								bucketState[bucket].currentBondIndex = 0;
							}
						})
					}

					if( calledBy === 'aAndBelow' ){
						bucketInfo.aAndBelowAdjustedBond =	previousAllocatedBond;
					}else if( calledBy === 'NY' || calledBy === 'CA' || calledBy === 'state' ){
						bucketInfo.stateAdjustedBond = previousAllocatedBond;
					}else if( calledBy === 'sector' || calledBy === 'HealthCare' ){
						bucketInfo.sectorAdjustedBond = previousAllocatedBond;
					}

				}
			}else{
				allocBucket[bucket] += chosenBondNewAlloc;	
				allocBucket[checkBucket] += prevBondAlloc - previousAllocatedBond.investAmt;

				previousAllocatedBond['investAmt'] += prevBondAlloc - previousAllocatedBond.investAmt;

				if( previousAllocatedBond.rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] += prevAllocBondChange;
				//if( previousAllocatedBond.state === 'NY' ) allocState['NY'] += prevAllocBondChange;
				//if( previousAllocatedBond.state === 'CA' ) allocState['CA'] += prevAllocBondChange;
				allocState[previousAllocatedBond.state] += prevAllocBondChange;

				allocSector[previousAllocatedBond.sector] += prevAllocBondChange;

				if( chosenBond.rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] += chosenBondNewAlloc;
				//if( chosenBond.state === 'NY' ) allocState['NY'] += chosenBondNewAlloc;
				//if( chosenBond.state === 'CA' ) allocState['CA'] += chosenBondNewAlloc;
				allocState[chosenBond.state] += chosenBondNewAlloc;

				allocSector[chosenBond.sector] += chosenBondNewAlloc;
				chosenBond.investAmt = chosenBondNewAlloc;
				allocatedData[bucket].push( chosenBond );

				if( ranking === 'aRated' || ranking === 'caMunis' || ranking === 'nyMunis' || ranking === 'HealthCare' ){
					bucketState.bucketStateKeys.forEach( bucket => {
						if( bucketState[bucket].currentRankIndex === rankIndex ){
							bucketState[bucket].currentRankIndex++;
							bucketState[bucket].currentBondIndex = 0;
						}
					})
				}

				if ( bucketControl['nextBucket'] !== null ) bucketControl['nextBucket'] = null;
			}
		}else{
			let par = allocatedAmount / ( chosenBond.price / 100 );
			let limitCheck = 0;
			let maxAlloc = 0;
			if( calledBy === 'aAndBelow' ){
				limitCheck = allocRating['aAndBelow'];
				maxAlloc = maxAandBelow;
			}else if( calledBy === 'HealthCare' ){
				limitCheck = allocSector['Health Care'];
				maxAlloc = maxHealthCare;
			}

			for ( let p = par; p >= this.state.minAllocBond; p -= this.state.minIncrement ){
			//	aAndBelowLimitCheck = allocRating['aAndBelow'];
				let tryAlloc = p * chosenBond.price / 100;
				
				if( calledBy === 'aAndBelow' || calledBy === 'HealthCare' ){
					if ( limitCheck + tryAlloc <= maxAlloc ){
						
						allocBucket[bucket] += tryAlloc;
						allocSector[sector] += tryAlloc;
						if( chosenBond.rating.slice(0,2) !== 'AA') allocRating['aAndBelow'] += tryAlloc;
						//if( chosenBond.state === 'NY' ) allocState['NY'] += tryAlloc;
						//if( chosenBond.state === 'CA' ) allocState['CA'] += tryAlloc;
						allocState[state] += tryAlloc;
						chosenBond.investAmt = tryAlloc;
						allocatedData[bucket].push( chosenBond );
						if ( bucketControl['nextBucket'] !== null ) bucketControl['nextBucket'] = null;
						if( ranking === 'aRated' || ranking === 'caMunis' || ranking === 'nyMunis' || ranking === 'HealthCare' ){
							bucketState.bucketStateKeys.forEach( bucket => {
								if( bucketState[bucket].currentRankIndex === rankIndex ){
									bucketState[bucket].currentRankIndex++;
									bucketState[bucket].currentBondIndex = 0;
								}
							})
						}
						break;
					}
				}
			}
		}
	}


	lookForBondInDiffRanking( argsObj ){
		const muniData = argsObj.muniBondInBucket;
		const ranking = this.state.ranking;
		const bucketMoney = argsObj.bucketMoney;
		const bucket = argsObj.bucket;
		let currentRankIndex = argsObj.currentBucketState.currentRankIndex;
		let chosenBond = argsObj.chosenBond;
		let idx = 0;
		let currentBondIndex = 0;

		while( !chosenBond && currentRankIndex < ranking.length - 1 ){
			chosenBond = muniData[ranking[++currentRankIndex]][currentBondIndex];
		}
		if( !chosenBond ){
			return argsObj;
		}

		argsObj.chosenBond = chosenBond;
		argsObj.currentBucketState.currentRankIndex = currentRankIndex;
		argsObj.currentBucketState.currentBondIndex = currentBondIndex;

		return argsObj;

	}


	checkBondForLimitSize( argsObj ){
		let chosenBond = argsObj.chosenBond;
		let allocatedAmount = 0;
		let testRank = argsObj.currentBucketState.currentRankIndex;
		const minIncrement = this.state.minIncrement;
		const ranking = this.state.ranking;
		const sector = chosenBond.sector;
		const rating = chosenBond.rating;
		const state = chosenBond.state;
		const price = chosenBond.price;
		const maxAllocBond = this.state.maxAllocBond;
		const minAllocBond = this.state.minAllocBond;
		const maxPercBond = this.state.maxPercBond;
		const investedAmount = this.state.investedAmount;
	  const maxBondSize = maxPercBond * investedAmount;
		let allocSize = maxAllocBond;

		if( allocSize * price / 100 > maxBondSize ){
			let bondIdx = argsObj.currentBucketState.currentBondIndex;
			let testPrice = 0;

			do{
				let bucketMunis = argsObj.muniBondInBucket[ranking[testRank]];
				for( let size = maxAllocBond - minIncrement; size >= minAllocBond; size -= minIncrement ){
					do{
						testPrice = bucketMunis[bondIdx].price;
						bondIdx++;
					}while( bondIdx <  bucketMunis.length && size * testPrice / 100 > maxBondSize )
					allocSize = size;
					if( allocSize * testPrice / 100 <= maxBondSize ) break;
					bondIdx = argsObj.currentBucketState.currentBondIndex;
				}

				if( allocSize * testPrice / 100 > maxBondSize ){
					argsObj.chosenBond = null;
					argsObj = this.lookForBondInDiffRanking( argsObj );
					if( !argsObj.chosenBond ){
						return argsObj;
					}
					testRank = argsObj.currentBucketState.currentRankIndex;
					bondIdx = 0;
					allocSize = maxAllocBond;
				}else{
					argsObj.chosenBond = bucketMunis[--bondIdx];
					allocatedAmount = Number(( allocSize * testPrice / 100).toFixed(2) );
					argsObj.allocatedAmount = allocatedAmount;
				
					argsObj.currentBucketState.allocSector[sector] ? argsObj.currentBucketState.allocSector[sector] += allocatedAmount
					:argsObj.currentBucketState.allocSector[sector] = allocatedAmount;

					argsObj.currentBucketState.allocRating[rating] ? argsObj.currentBucketState.allocRating[rating] += allocatedAmount
					:argsObj.currentBucketState.allocRating[rating] = allocatedAmount;

					argsObj.currentBucketState.allocState[state] ? argsObj.currentBucketState.allocState[state] += allocatedAmount
					:argsObj.currentBucketState.allocState[state] = allocatedAmount;

					argsObj.currentBucketState.currentBondIndex = bondIdx + 1;

					return argsObj;
				}

			} while ( testRank < ranking.length )
			argsObj.chosenBond = null;
			return argsObj;

		}else if ( minAllocBond * price / 100 > argsObj.bucketMoney ) {
			argsObj.chosenBond = null;
			return argsObj;
		}else{

			allocatedAmount = Number(( allocSize * price / 100).toFixed(2) );
			argsObj.allocatedAmount = allocatedAmount;
	
			argsObj.currentBucketState.allocSector[sector] ? argsObj.currentBucketState.allocSector[sector] += allocatedAmount
			:argsObj.currentBucketState.allocSector[sector] = allocatedAmount;

			argsObj.currentBucketState.allocRating[rating] ? argsObj.currentBucketState.allocRating[rating] += allocatedAmount
			:argsObj.currentBucketState.allocRating[rating] = allocatedAmount;

			argsObj.currentBucketState.allocState[state] ? argsObj.currentBucketState.allocState[state] += allocatedAmount
			:argsObj.currentBucketState.allocState[state] = allocatedAmount;

			argsObj.currentBucketState.currentBondIndex++;

			return argsObj;
		}

	}

  generateLadder( bucketsObj ){

		let cnt = 0;
		let idx = 0;
		let currentBondIndex = 0;
		let price = 0;
		let amountToSector = 0
		let numBuckets = 1;
		let currentRankIndex = 0;
		let startIndex = 0;
		let allocateToCash = 0;
		let rating = '';
		let sector = '';
		let chosenBond = [];
		let arrBucketsToRemove = [];
		let buckets = [...this.state.ytmLadder];
		let allocSector =  {};
		let allocRating = {};
		let allocBucket = {};
		let allocState = {};
		let argsObj = {};
		let cashObject = {};
		let bucketControl = { nextBucket: null };
		let bucketState = Object.assign({}, bucketsObj);

		const muniData = [...this.state.rankedMuniList];
		const allocatedData = {};
		const ranking = this.state.ranking;
		const investedAmount = this.state.investedAmount;


		if( buckets.length !== 0 ) numBuckets = buckets.length;
		if( buckets.length === 0 ) {
			alert('Please select min and max maturity for the buckets!');
			return;
		}
		const bucketMoney = Number(( investedAmount / numBuckets ).toFixed(0));

		let bucketIndex = numBuckets - 1;
		let bucket = buckets[bucketIndex];
		allocSector['Cash'] = 0;
		console.log('Before the loop begins - muniData bucketState------', muniData, bucketState );

		do{
			currentRankIndex = bucketState[bucket]['currentRankIndex'];
			currentBondIndex = bucketState[bucket]['currentBondIndex'];
//			if(bucket===14 && currentBondIndex===0) debugger;
			//debugger;
			if( currentRankIndex < ranking.length ){

				chosenBond = muniData[bucket][ranking[currentRankIndex]][currentBondIndex];
				console.log("Start Of Loop - bucket, buckets, bucketIdx, bondIdx, rankIdx----", bucket, buckets, bucketIndex, currentBondIndex, currentRankIndex)
				argsObj = { muniBondInBucket: muniData[bucket], bucket, bucketMoney, currentBucketState: bucketState[bucket],  bucketState, chosenBond, bucketControl, buckets, ranking: ranking[currentRankIndex] };
			}

			if( !chosenBond && currentRankIndex < ranking.length ){
				argsObj = this.lookForBondInDiffRanking( argsObj )
				chosenBond = argsObj.chosenBond;

				if( chosenBond ){
					argsObj = this.checkBondForLimitSize( argsObj );
					console.log('chosenBond from diff ranking after look for Bond In Diff Ranking', argsObj.chosenBond)
					if( argsObj.chosenBond ){
						this.allocateData( argsObj, allocatedData, allocBucket, allocSector, allocRating, allocState, bucketState, bucket )
					}else{
						cashObject = {};
						cashObject['cusip'] = 'Cash';
						cashObject['investAmt'] = bucketMoney;
						allocSector['Cash'] += bucketMoney;

						if( allocBucket[bucket] ){
							cashObject['investAmt'] -= allocBucket[bucket];
							allocSector['Cash'] -= allocBucket[bucket];
						}

						if( allocatedData[bucket] ) allocatedData[bucket].push( cashObject )
						else allocatedData[bucket] = [cashObject];
						idx = buckets.indexOf( bucket );
						buckets.splice( idx, 1 );
					}
				}else{
					cashObject = {};
					cashObject['cusip'] = 'Cash';
					cashObject['investAmt'] = bucketMoney;
					allocSector['Cash'] += bucketMoney;

					if( allocBucket[bucket] ){
						cashObject['investAmt'] -= allocBucket[bucket];
						allocSector['Cash'] -= allocBucket[bucket];
					}

					if( allocatedData[bucket] ) allocatedData[bucket].push( cashObject )
					else allocatedData[bucket] = [cashObject];
					idx = buckets.indexOf( bucket );
					buckets.splice( idx, 1 );
				}

			}else if( currentRankIndex < ranking.length ){
				argsObj = this.checkBondForLimitSize( argsObj );
				if( !argsObj.chosenBond ){
					cashObject = {};
					cashObject['cusip'] = 'Cash';
					cashObject['investAmt'] = bucketMoney;
					allocSector['Cash'] += bucketMoney;

					if( allocBucket[bucket] ){
						cashObject['investAmt'] -= allocBucket[bucket];
						allocSector['Cash'] -= allocBucket[bucket];
					}

					if( allocatedData[bucket] ) allocatedData[bucket].push( cashObject );
					else allocatedData[bucket] = [cashObject];
					idx = buckets.indexOf( bucket );
					buckets.splice( idx, 1 );
				}else{
					this.allocateData( argsObj, allocatedData, allocBucket, allocSector, allocRating, allocState, bucketState, bucket )
				}

				console.log('Return from limit check bound found in Rank - bucket, argsObj, bucketState, allocBucket, allocSector, allocRating, allocatedData---', bucket, argsObj, bucketState, allocBucket, allocSector, allocRating, allocatedData)
			}else{

				cashObject = {};
				cashObject['cusip'] = 'Cash';
				cashObject['investAmt'] = bucketMoney;
				allocSector['Cash'] += bucketMoney;

				if( allocBucket[bucket] ){
					cashObject['investAmt'] -= allocBucket[bucket];
					allocSector['Cash'] -= allocBucket[bucket];
				}

				if( allocatedData[bucket] ) allocatedData[bucket].push( cashObject );
				else allocatedData[bucket] = [cashObject];
				idx = buckets.indexOf( bucket );
				buckets.splice( idx, 1 );
			}

			numBuckets = buckets.length;

			console.log('Before buckets change-numBuckets, bucket, bucketIdx, bucketControl --- ', numBuckets, bucket, bucketIndex, bucketControl)
			if( bucketControl['nextBucket'] ){
				// case when health care was allocated to previous bucket => do not change bucket
				bucketControl['nextBucket'] = null;

			}else{

				if( ( bucketIndex === 0 &&  numBuckets > 1 ) || ( numBuckets === 1 ) ){
					bucketIndex = numBuckets - 1;
					bucket = buckets[bucketIndex];
				}else if( bucketIndex === 0 && numBuckets === 1 ){
					console.log('one bucket only..............remain the same')
				}else if( numBuckets > 1 ){
					bucket = buckets[--bucketIndex]
				}

			}

		//cnt++
			//numBuckets > 0
		}while( numBuckets > 0 )


		if( this.state.cashReducer === 'Yes' )
			this.allocateCash( allocatedData, allocSector, allocRating, allocState );

		/*
		let fields = Object.keys( allocRating );
		fields.forEach( field => {
			allocSector[field] = allocRating[field];
		})

		fields = Object.keys( allocState );
		fields.forEach( field => {
			allocSector[field] = allocState[field]
		})
		*/
		let summary = { allocSector, allocState, allocRating };
		console.log('FINAL.....summary, allocatedData----', summary, allocatedData);
	
		const bucketsSummary = this.createSummary( summary );
		const bucketsByRows = this.createRows( allocatedData );
		const columns = this.createColumns();
		console.log('SET FOR SHOW.....summary,rows,columns', bucketsSummary, bucketsByRows, columns);

		this.setState({ columns });
		this.setState({ bucketsByRows });
		this.setState({ allocatedData });
		this.setState({ allocSector });
		this.setState({ allocRating });
		this.setState({ bucketsSummary });

  }

  	allocateCash( allocatedData, allocSector, allocRating, allocState ){
		const munis = [...this.state.rankedMuniList];
		const investedAmount = this.state.investedAmount;
		const maxHealthCare = this.state.maxHealthCare * investedAmount;
		const maxSector = this.state.maxSector * investedAmount;
		const maxNYState = this.state.maxNYState * investedAmount;
		const maxCAState = this.state.maxCAState * investedAmount;
		const maxState = this.state.maxState * investedAmount;
		const maxAandBelow = this.state.maxRating * investedAmount;
		const minIncrement = this.state.minIncrement;
		const ranking = this.state.ranking;
		let testBond = {};
		let buckets = [...this.state.ytmLadder];
		let allocatedCash = 0;
		let bucketLength = 0;

		let price = 0;
		let rating = null;
		let sector = null;
		let state = null;
		let minIncrementToAllocate = 0;
		let allocationLimit = 0;
		//let currentAllocation = 0;
		let leftRoom = 0;
		let rankIndex = 0;
		let bondIndex = 0;
		let trackOverLimit = {};
		let limitType = '';


		debugger;

		buckets.forEach( bucketNumber => {
			let bucket = allocatedData[bucketNumber];
			bucketLength = bucket.length - 1;
			allocatedCash = bucket[bucketLength].investAmt;
			for( let i = 0; i < bucketLength; i++ ){

				price = bucket[i].price;
				sector = bucket[i].sector;
				state = bucket[i].state;
				allocationLimit = maxSector - allocSector[sector];
				limitType = 'sector';
				//currentAllocation = allocSector[sector];
				
				leftRoom = maxState - allocState[state];
				if( allocationLimit > leftRoom ){
					allocationLimit = leftRoom;
					limitType = state;
				}

				if( bucket[i].rank === 'HealthCare' ){
	 				leftRoom = maxHealthCare - allocSector[sector];
 					if( allocationLimit > leftRoom ){
						allocationLimit = leftRoom;
						limitType = 'HealthCare';
						//currentAllocation = allocSector[sector]
					}	
				}
				if( bucket[i].rank === 'nyRated' ){
			   		leftRoom = maxNYState - allocState['NY'];
					if( allocationLimit > leftRoom ){
						allocationLimit = leftRoom;
						limitType = state;
						//currentAllocation = allocState['NY']
					}

				}
				if( bucket[i].rank === 'caRated' ){
					leftRoom = maxCAState - allocState['CA'];
					if( allocationLimit > leftRoom ){
						allocationLimit = leftRoom;
						limitType = state;
					//	currentAllocation = allocState['CA']
					}
				}
				if( bucket[i].rank === 'aRated' || bucket[i].rating.slice(0,2) !== 'AA' ){
					leftRoom = maxAandBelow - allocRating['aAndBelow'];
					if( allocationLimit > leftRoom ){
						allocationLimit = leftRoom;
						limitType = 'aAndBelow';
					//	currentAllocation = allocRating['aAndBelow']
					}

				}
			
				minIncrementToAllocate = ( allocatedCash ) / ( minIncrement * ( price * 1 / 100 ) );

				const bondNum = Math.floor( minIncrementToAllocate );
				let checkIncrements = 1;
				let maxIncrement = true;

				if( bondNum > 0 ){
			
					do{

						minIncrementToAllocate = Math.floor( checkIncrements ) * ( minIncrement * ( price * 1 / 100 ) );			
						if( minIncrementToAllocate > 0 && minIncrementToAllocate <= allocationLimit && ( bucket[i].investAmt + minIncrementToAllocate <= this.state.maxPercBond * this.state.investedAmount ) && ( ( bucket[i].investAmt + minIncrementToAllocate ) / ( bucket[i].price / 100 ) ) <= this.state.maxAllocBond ){
						checkIncrements++;
							
						}else{
							maxIncrement = true;
						}
					} while( checkIncrements <= bondNum && !maxIncrement )
				}
				minIncrementToAllocate = checkIncrements;
				minIncrementToAllocate = Math.floor( minIncrementToAllocate ) * ( minIncrement * ( price * 1 / 100 ) );
		
				if( minIncrementToAllocate > 0 && minIncrementToAllocate <= allocationLimit && ( bucket[i].investAmt + minIncrementToAllocate <= this.state.maxPercBond * this.state.investedAmount ) && ( ( bucket[i].investAmt + minIncrementToAllocate ) / ( bucket[i].price / 100 ) ) <= this.state.maxAllocBond && allocatedCash >= minIncrementToAllocate || ( checkIncrements === 1 && !trackOverLimit[limitType] && allocatedCash >= minIncrementToAllocate ) ){
					if( !trackOverLimit[limitType] ) trackOverLimit[limitType] = true;
		
					bucket[bucketLength].investAmt = allocatedCash - minIncrementToAllocate;
					bucket[i].investAmt += minIncrementToAllocate;
//					if( bucket[i].state === 'NY' ) allocState['NY'] += minIncrementToAllocate;
//					if( bucket[i].state === 'CA' ) allocState['CA'] += minIncrementToAllocate;
					allocState[bucket[i].state] += minIncrementToAllocate;
					if( bucket[i].rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] += minIncrementToAllocate;
					allocSector[sector] += minIncrementToAllocate;
					allocSector.Cash -= allocatedCash;
					allocSector.Cash += bucket[bucketLength].investAmt;
					allocatedCash = bucket[bucketLength].investAmt;

				}
			}

			if( allocatedCash > 0){

				do{
					for( let i = 0; i <  munis[bucketNumber][ranking[rankIndex]].length; i++ ){
						testBond = Object.assign( {}, munis[bucketNumber][ranking[rankIndex]][bondIndex] );
						price = testBond.price;
						sector = testBond.sector;
						state = testBond.state;
						allocationLimit = maxSector - allocSector[sector];
					//	currentAllocation = allocSector[sector];
						leftRoom = maxState - allocState[state];
						if( allocationLimit > leftRoom ){
							allocationLimit = leftRoom;
						}

						if( testBond.rank === 'HealthCare' ){
							 leftRoom = maxHealthCare - allocSector[sector];
							 if( allocationLimit > leftRoom ){
								allocationLimit = leftRoom;
					//			currentAllocation = allocSector[sector]
							}
						}
						if( testBond.rank === 'nyRated' ){
							leftRoom = maxNYState - allocState['NY'];
							if( allocationLimit > leftRoom ){
								allocationLimit = leftRoom;
					//			currentAllocation = allocState['NY']
							}

						}
						if( testBond.rank === 'caRated' ){
							leftRoom = maxCAState - allocState['CA'];
							if( allocationLimit > leftRoom ){
								allocationLimit = leftRoom;
					//			currentAllocation = allocState['CA']
							}
						}
						if( testBond.rank === 'aRated' || testBond.rating.slice(0,2) !== 'AA' ){
							leftRoom = maxAandBelow - allocRating['aAndBelow'];
							if( allocationLimit > leftRoom ){
								allocationLimit = leftRoom;
					//			currentAllocation = allocRating['aAndBelow']
							}

						}

						minIncrementToAllocate = ( allocatedCash ) / ( this.state.minAllocBond * ( price * 1 / 100 ) );
						minIncrementToAllocate = Math.floor( minIncrementToAllocate ) * ( this.state.minAllocBond * ( price * 1 / 100 ) );

						if( minIncrementToAllocate > 0 && minIncrementToAllocate <= allocationLimit && ( minIncrementToAllocate <= this.state.maxPercBond * this.state.investedAmount ) && ( minIncrementToAllocate / ( testBond.price / 100 ) ) <= this.state.maxAllocBond ){
							bucket[bucketLength].investAmt = allocatedCash - minIncrementToAllocate;
							testBond.investAmt = 0 + minIncrementToAllocate;

//							if( testBond.state === 'NY' ) allocState['NY'] += minIncrementToAllocate;
//							if( testBond.state === 'CA' ) allocState['CA'] += minIncrementToAllocate;
							allocState[state] ? allocState[state] += minIncrementToAllocate : allocState[state] = minIncrementToAllocate;
							if( testBond.rating.slice(0,2) !== 'AA' ) allocRating['aAndBelow'] += minIncrementToAllocate;
							allocSector[sector] += minIncrementToAllocate;
							allocSector.Cash -= allocatedCash;
							allocSector.Cash += bucket[bucketLength].investAmt;
							allocatedCash = bucket[bucketLength].investAmt;
							allocatedData[bucketNumber].splice(bucketLength, 0, testBond);
							bucketLength++;
						}
						bondIndex++;
					}
					rankIndex++;
					bondIndex = 0;

				}while( rankIndex < ranking.length )
				rankIndex = 0;
			}

		})
	}

	createSummary( summary ){
		let groups = Object.keys( summary );
		let bucketsSummary = [];
		let rowObj = {};
		let arrangedPortfolioSummary = [];
		const columnFields = [ 'portfolioSummary', 'dollarAllocated', 'percentageAllocated', 'rule', 'group' ];

		groups.forEach( alloc => {
			let fields = Object.keys( summary[alloc] );
			let group = alloc;
			fields.forEach( field => {	
			
				rowObj[columnFields[0]] = field;
				rowObj[columnFields[1]] = '$' + ( summary[alloc][field] ).toLocaleString();
				rowObj[columnFields[2]] = Number( ( ( summary[alloc][field] * 1 / this.state.investedAmount *  1 ) * 100 ).toFixed(2) ) + '%';
				rowObj[columnFields[4]] = group;

				if( field === 'Health Care' ){
					rowObj[columnFields[3]] = '<= 12%';
				}else if( field === 'aAndBelow' ){
					rowObj[columnFields[3]] = '<= 30%';
				}else if( group === 'allocSector' && field !== 'Cash' ){
					rowObj[columnFields[3]] = '<= 30%';
				}else if( group === 'allocState' ){
					rowObj[columnFields[3]] = '<= 20%';
				}else if( field === 'NY' ){
					rowObj[columnFields[3]] = '<= 20%';
				}else if( field === 'CA' ){
					rowObj[columnFields[3]] = '<= 20%';
				}
				if( rowObj[columnFields[1]] !== '$0' ){
					bucketsSummary.push( rowObj );
					rowObj = {};
				}
			})	
		})
	
		let sectorObj = 0;
		let ratingObj = 0;
		let stateObj = 0;

		const arrLen = bucketsSummary.length - 1;
		for( let i = 0; i < arrLen + 1; i++ ){
			if( bucketsSummary[i].group === 'allocSector' ){
				sectorObj++;
			}else if( bucketsSummary[i].group === 'allocState' ){
				stateObj++;
			}else if( bucketsSummary[i].group === 'allocRating') {
				ratingObj++;
			}
		}
		let stateStart = sectorObj + ratingObj - 1;
		let stateStartRest = stateStart + 2;
		let startRating = sectorObj - 1;
		
		arrangedPortfolioSummary = bucketsSummary.map( ( obj, index ) => {
			let indexedObj = {};
			let startIndex = 0;
			indexedObj = Object.assign( obj, { index: index } );
	
			if( obj.group === 'allocSector' && obj.portfolioSummary === 'Health Care' ){
				indexedObj = { id: startIndex, obj };
			}else if( obj.group === 'allocSector' && obj.portfolioSummary !== 'Cash' ){
				indexedObj = { id: ++startIndex, obj }
			}else if( obj.group === 'allocState' && obj.portfolioSummary === 'CA' ){
				indexedObj = { id: stateStart + 1, obj };
			}else if( obj.group === 'allocState' && obj.portfolioSummary === 'NY' ){
				indexedObj = { id: stateStart, obj }
			}else if( obj.group === 'allocState' ){
				indexedObj = { id: ++stateStartRest, obj };
			}else if( obj.portfolioSummary === 'aAndBelow' ){
				obj.portfolioSummary = 'A Rated and Below';
				indexedObj = { id: startRating, obj }
			}else if( obj.portfolioSummary === 'Cash' ){
				indexedObj = { id: arrLen, obj }
			}
			
			return indexedObj;
		})

		console.log('..................arrangedPortfolioSummary', arrangedPortfolioSummary);
		arrangedPortfolioSummary.sort( function(a, b){ return a.id - b.id } );
		return arrangedPortfolioSummary.map( obj => bucketsSummary[obj.obj.index] );
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
		const portfolioSize = '$' + parseInt(this.state.investedAmount).toLocaleString();

		let lenBucket = [];
		let bucketsByRows = [];
		let maxBondsInBucket = 0;
		let rowsPerBond = 4;
		let bond = {};
		let row = {};
		let totalByBucket = {};
		let totalInBucket = 0;
		let bucketIndex = buckets[0];
		let numBonds = 0;
		let cashPosition = 0;
		let avgEffDuration = 0;
		let avgModDuration = 0;
		let avgPrice = 0;
		let avgCoupon = 0;
		let avgYtw = 0;
		let tdRange = [];
		let portfolioSummary = [];
		let minTdDate = 0;
		let maxTdDate = 0;
		let tradeDateRange = '';

		buckets.forEach( bucket => {
				lenBucket.push( objBuckets[bucket].length );
				numBonds += objBuckets[bucket].length - 1;

				for( let j = 0; j < objBuckets[bucket].length; j++ ){
					totalInBucket += objBuckets[bucket][j].investAmt;
				}
				totalByBucket[bucket] = '$' + totalInBucket.toLocaleString();
				totalInBucket = 0;
		})

		maxBondsInBucket = Math.max(...lenBucket);
		console.log('.....totalByBucket,maxBondInBucket, rowsPerBond, bucketIndex, numBuckets, numBonds', totalByBucket,maxBondsInBucket, rowsPerBond, bucketIndex, numBuckets, objBuckets, numBonds);
		for(let i = 0; i < maxBondsInBucket; i++){
			for(let j = 0; j < rowsPerBond; j++){
				for(let k = bucketIndex; k < numBuckets + bucketIndex*1; k++){

					bond = objBuckets[k][i];

					if( bond ){
						if( j === 0 ){
							if( bond.cusip === 'Cash' ){
								row[(k).toString()] = bond.cusip + ': $' + bond.investAmt.toLocaleString();
								cashPosition += bond.investAmt;
							}else{
								row[(k).toString()] = bond.cusip + ', ' + bond.coupon + '%, ' + bond.maturity;
							}
						}else if( j === 1 && bond.cusip !== 'Cash' ){
							row[(k).toString()] = bond.state + ', ' + bond.sector + ', ' + bond.rating;

							avgEffDuration += bond.ed * bond.investAmt;
							avgModDuration += bond.md * bond.investAmt;
							avgYtw += bond.ytw * bond.investAmt;
							avgPrice += bond.price * bond.investAmt;
							avgCoupon += bond.coupon * bond.investAmt
							tdRange.push( new Date ( bond.lastTraded ).getTime() );
						}else if( j === 2 && bond.cusip !== 'Cash' ){
								row[(k).toString()] = bond.lastTraded + ', ' + bond.price;
						}else if( j === 3 && bond.cusip !== 'Cash' ){
							let par = Number( (bond.investAmt / ( bond.price / 100 ) ).toFixed(0) ).toLocaleString();
							row[(k).toString()] = '$' + bond.investAmt.toLocaleString() + ', ' + par;
						}
					}

				}
				if( Object.keys( row ).length !== 0 ){
					bucketsByRows.push( row );
					row = {};
				}
			}
			bucketsByRows.push( {} );
		}

		minTdDate = Math.min( ...tdRange );
		maxTdDate = Math.max( ...tdRange );
		minTdDate = new Date( minTdDate ).toLocaleString().split(',')[0];
		maxTdDate = new Date( maxTdDate ).toLocaleString().split(',')[0];
		if( minTdDate === 'Invalid Date' || maxTdDate === 'Invalid Date' ){
			tradeDateRange = ''
		}else{
			tradeDateRange = minTdDate + ' - ' + maxTdDate;
		}

		avgEffDuration = Number( avgEffDuration / ( this.state.investedAmount - cashPosition ) ).toFixed(2);
		if( isNaN( avgEffDuration ) ) avgEffDuration = '';
		avgModDuration = Number( avgModDuration / ( this.state.investedAmount - cashPosition ) ).toFixed(2);
		if( isNaN( avgModDuration ) ) avgModDuration = '';
		avgYtw = Number( avgYtw / ( this.state.investedAmount - cashPosition ) ).toFixed(2);
		if( isNaN( avgYtw ) ) avgYtw = '';
		else avgYtw = avgYtw + '%';
		avgCoupon = Number( avgCoupon / ( this.state.investedAmount - cashPosition ) ).toFixed(2);
		if( isNaN( avgCoupon ) ) avgCoupon = '';
		else avgCoupon = avgCoupon + '%';
		avgPrice = Number( avgPrice / ( this.state.investedAmount - cashPosition ) ).toFixed(2);
		if( isNaN( avgPrice ) ) avgPrice = '';
		cashPosition = '$' +  Number(cashPosition.toFixed(2)).toLocaleString();

		portfolioSummary.push( { avgPrice, avgCoupon, yieldToWorst: avgYtw, modifiedDuration: avgModDuration, effectiveDuration: avgEffDuration, cash: cashPosition, numberOfBonds: numBonds, portfolioSize, tradeDateRange } );

		this.setState( { portfolioSummary } );
		bucketsByRows.push( totalByBucket );
		return bucketsByRows;
	}

   render() {
 	 console.log('.....in App.js, this.state',this.state)

    const munis = [...this.state.munis];
    return (
      <div className="container-fluid">
        <Nav handleCashReducerChange = { this.handleCashReducerChange } handleMinAllocChange = { this.handleMinAllocChange } filterMaturity = { this.filterMaturity } setLadder = { this.setLadder }/>
          <div style={{ marginTop: '135px' }} className="row">
			<PortfolioSummary portfolioSummary = { this.state.portfolioSummary } />
			{ this.state.bucketsByRows.length !== 0 ?
				<div className="col-sm-8">
					<BucketAllocation columns = { this.state.columns } bucketsByRows = { this.state.bucketsByRows }/>
					<BucketSummary bucketsSummary = { this.state.bucketsSummary } />
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
