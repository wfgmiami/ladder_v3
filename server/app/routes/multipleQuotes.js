const express = require('express');
const router = new express.Router();

const yahooFinance = require('yahoo-finance');
const dateFormat = require('dateformat');
module.exports = router;


const portfolio = ['AAPL', 'FB', 'AMZN', 'BABA', 'TSLA', 'GOOGL'];


router.get('/', (req, res, next) => {
	console.log('in quote.....')
	let stockArr = [];

	portfolio.forEach( stock => {
	yahooFinance.quote({
		symbol:stock,
		modules: ['price', 'summaryDetail']
	})
	.then( quotes => stockArr.push( { quotes }))
	.then( () => {

		if( stockArr.length === portfolio.length ){
			let tempArr = [];
			stockArr.forEach( dataPoint => {
				tempArr.push( dataPoint.quotes.price.symbol );
			})
			tempArr.sort();
			let newArray = [];
			tempArr.forEach( item => {
				newArray = newArray.concat( stockArr.filter( origObj => origObj.quotes.price.symbol === item ) );
			})
			return newArray;
		}
	})
	.then( ( finalArr ) => {
		if( finalArr ) res.send( finalArr )
	})
	.catch( next )

	})


})
