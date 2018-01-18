const express = require('express');
const router = new express.Router();
const fs = require('fs');

module.exports = router;
const currentYear = new Date().getFullYear();

//const muniData = require( '../../../muniList_0109.json');
//const adjustedMuniData = createNewObject( muniData );

 //fs.writeFile( './muniData.json', JSON.stringify( adjustedMuniData ), 'utf-8', function( err ) {
//	if ( err ) throw err;
//	console.log('done')
//})


const adjustedMuniData = require( '../../../muniData.json');

router.get('/', (req, res, next) =>{
	res.send( adjustedMuniData );
})

router.get('/filter', (req, res, next) => {
	let maturityRange  = [];
	let filteredMunis = [];
	let minMaturity = req.query.min * 1;
	let maxMaturity = req.query.max * 1;

	for(let i = minMaturity; i <= maxMaturity; i++){
		maturityRange.push(i * 1);
	}

	maturityRange.forEach( maturity => {
		let tempArray = adjustedMuniData.filter( muni => {
			   	return muni.ytm * 1 === maturity
		});

		filteredMunis = filteredMunis.concat( tempArray );
	})
	res.send( filteredMunis );
})


function createNewObject(arr) {
	let obj = {};
	let munis = [];

	arr.forEach( muni => {
		obj.cusip = muni.CUSIP;
		obj.price = muni['Market Price'];
		obj.coupon = muni.Coupon;
		let dt = muni['Stated Maturity'].split('/');
		if( dt.length == 3 )	obj.maturity = dt[0] + '/' + dt[1] + '/' + dt[2].slice(-2);
		else obj.maturity = '';
		let maturityYear = muni['Stated Maturity'].slice(-4);
		obj.ytm = maturityYear - currentYear;
		if (obj.ytm < 0) obj.ytm = 0;
		obj.sector = muni['Holdings Sector'];
		obj.rating = muni['Opinion Internal Rating'];
		obj.state = muni.State;
		dt = muni.LastTraded.split('/');
		if (dt.length == 3 ) obj.lastTraded = dt[0] + '/' + dt[1] + '/' + dt[2].slice(-2);
		else obj.lastTraded = '';
		obj.ed = muni.EffectiveDuration;
		obj.md = muni.ModifiedDuration;
		obj.ytw = muni.YieldToWorst;
		munis.push(obj);
		obj= {};
	})

	return munis;
}

