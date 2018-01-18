const express = require('express');
const router = new express.Router();

const yahooFinance = require('yahoo-finance');
const dateFormat = require('dateformat');
module.exports = router;


router.get('/:symbol', (req, res, next) => {

	const symbol = req.params.symbol;
	console.log('in quote.....', symbol )

	yahooFinance.quote({
		symbol: symbol,
		modules: ['price', 'summaryDetail']
	})
	.then( quote => res.send (quote))
	.catch( next )

})
